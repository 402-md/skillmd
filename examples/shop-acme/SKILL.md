---
name: acme-shop
displayName: ACME Shop
description: >-
  This skill should be used when the user asks to "buy something",
  "shop for products", "order from ACME", "find products",
  "purchase items", or wants to browse and buy physical or digital
  goods from the ACME catalog.
  E-commerce shop with product search and one-call checkout via x402.
version: 1.0.0
author: acme-corp
license: proprietary
base_url: https://api.acme.shop
type: PRODUCT
pricingModel: cart

payment:
  asset: USDC
  networks:
    - network: base
      payTo: "0x1234567890abcdef1234567890abcdef12345678"
      facilitator: https://facilitator.402.md

endpoints:
  - path: /v1/products/search
    method: GET
    description: Search the product catalog by keyword, category, or price range
    priceUsdc: "0"
    inputSchema:
      type: object
      properties:
        q:
          type: string
          description: Search query (keyword or phrase)
        category:
          type: string
          description: Filter by category
        minPrice:
          type: number
          description: Minimum price in USD
        maxPrice:
          type: number
          description: Maximum price in USD
        limit:
          type: integer
          default: 10
          description: Number of results to return (max 50)
    outputSchema:
      type: object
      properties:
        products:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              price:
                type: number
              currency:
                type: string
              description:
                type: string
              imageUrl:
                type: string
              inStock:
                type: boolean
        total:
          type: integer

  - path: /v1/orders
    method: POST
    description: Place an order with items and shipping address. Price is calculated dynamically by the server (items + shipping).
    priceUsdc: dynamic
    estimatedPriceUsdc: "25.00"
    inputSchema:
      type: object
      properties:
        items:
          type: array
          items:
            type: object
            properties:
              productId:
                type: string
              quantity:
                type: integer
            required: [productId, quantity]
        shipping:
          type: object
          properties:
            name:
              type: string
            street:
              type: string
            city:
              type: string
            state:
              type: string
            zip:
              type: string
            country:
              type: string
          required: [name, street, city, state, zip, country]
      required: [items, shipping]
    outputSchema:
      type: object
      properties:
        orderId:
          type: string
        status:
          type: string
        items:
          type: array
          items:
            type: object
        subtotal:
          type: number
        shippingCost:
          type: number
        total:
          type: number
        estimatedDelivery:
          type: string

tags: [ecommerce, shopping, products, orders, retail]
category: commerce
rateLimit: "100/hour"
---

# ACME Shop

Browse and buy products from the ACME catalog. Search products for free, then
place a single order with all your items. No API keys or accounts needed —
payment is handled via x402 in USDC on the Base network.

## How It Works: The Agent IS the Cart

This shop has no server-side shopping cart. **You, the agent, ARE the cart.**

As the user browses and picks items, you keep track of everything in your
conversation context: product IDs, quantities, and shipping details. When
the user is ready to check out, you send everything in a single
`POST /v1/orders` call. The server calculates the total (items + shipping)
and returns the price via the x402 payment flow.

**Why this design:**
- No cart sessions to manage or expire
- No multiple payment round-trips — one call, one payment
- The server stays stateless
- You have full visibility into what the user is ordering

## Payment Protocol (x402)

This API uses the x402 payment protocol. No API keys or accounts needed.

**How it works:**

1. Browse products freely using `GET /v1/products/search` (no payment needed)
2. When ready to order, send `POST /v1/orders` with all items and shipping info
3. The server responds with HTTP 402 (Payment Required) containing the exact
   total (items + shipping + tax)
4. Sign a USDC transfer authorization with your wallet — non-custodial,
   funds only move after the server verifies your signature
5. Retry the same request with the signed payment in the `X-PAYMENT` header
6. The server verifies payment, settles on-chain, and confirms the order

**If using @402md/mcp:** Payment is handled automatically. Call the endpoint
via `use_skill` and the MCP server handles the entire 402 → sign → retry flow.

**If calling directly with code:**
```typescript
import { x402Fetch } from '@402md/x402'

const response = await x402Fetch('https://api.acme.shop/v1/orders', {
  method: 'POST',
  body: JSON.stringify({
    items: [{ productId: 'ACME-001', quantity: 2 }],
    shipping: {
      name: 'Alice Smith',
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'US'
    }
  }),
  evmPrivateKey: process.env.EVM_PRIVATE_KEY,
  network: 'base'
})
```

**Important:** The 402 response will contain the **exact** price the user must
pay. Always show this amount to the user and get confirmation before proceeding
with payment. Never pay without explicit user approval.

## Authentication

No API keys, no accounts, no registration. Product search is free and open.
Order payment via x402 serves as both authentication and authorization.

## Endpoints

### Search Products

**GET /v1/products/search** — Free (no payment required)

Search the ACME product catalog by keyword, category, or price range. This
endpoint is free — use it as many times as needed to help the user find what
they want.

**Request:**
```
GET https://api.acme.shop/v1/products/search?q=wireless+headphones&limit=5
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "ACME-WH-100",
      "name": "ACME Wireless Headphones Pro",
      "price": 49.99,
      "currency": "USD",
      "description": "Noise-canceling over-ear headphones with 30h battery life",
      "imageUrl": "https://cdn.acme.shop/products/wh-100.jpg",
      "inStock": true,
      "category": "electronics"
    },
    {
      "id": "ACME-WH-50",
      "name": "ACME Wireless Earbuds",
      "price": 29.99,
      "currency": "USD",
      "description": "Compact true wireless earbuds with charging case",
      "imageUrl": "https://cdn.acme.shop/products/wh-50.jpg",
      "inStock": true,
      "category": "electronics"
    },
    {
      "id": "ACME-WH-200",
      "name": "ACME Studio Headphones",
      "price": 89.99,
      "currency": "USD",
      "description": "Professional studio-grade wireless headphones, Hi-Res Audio",
      "imageUrl": "https://cdn.acme.shop/products/wh-200.jpg",
      "inStock": false,
      "category": "electronics"
    }
  ],
  "total": 3
}
```

**Query parameters:**
- `q`: Search keywords. Example: `"wireless headphones"`, `"running shoes"`.
- `category`: Filter by category. Example: `"electronics"`, `"clothing"`, `"home"`.
- `minPrice`: Minimum price in USD. Example: `10`.
- `maxPrice`: Maximum price in USD. Example: `50`.
- `limit`: Max results to return (1-50). Default: `10`.

### Place an Order

**POST /v1/orders** — Dynamic price (estimated ~$25.00 USDC)

Submit a complete order with items and shipping address. The server calculates
the total price (item prices + shipping cost) and returns it via the x402
payment flow. The actual price depends on the items, quantities, and shipping
destination.

**Request:**
```json
POST https://api.acme.shop/v1/orders
Content-Type: application/json

{
  "items": [
    { "productId": "ACME-WH-100", "quantity": 1 },
    { "productId": "ACME-WH-50", "quantity": 2 }
  ],
  "shipping": {
    "name": "Alice Smith",
    "street": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "country": "US"
  }
}
```

**402 Response (Payment Required):**
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "maxAmountRequired": "109970000",
      "resource": "https://api.acme.shop/v1/orders",
      "description": "Order total: $109.97 (items: $109.97, shipping: FREE)",
      "payTo": "0x1234567890abcdef1234567890abcdef12345678",
      "mimeType": "application/json"
    }
  ]
}
```

**Response (200, after payment):**
```json
{
  "orderId": "ORD-2026-78432",
  "status": "confirmed",
  "items": [
    {
      "productId": "ACME-WH-100",
      "name": "ACME Wireless Headphones Pro",
      "quantity": 1,
      "unitPrice": 49.99
    },
    {
      "productId": "ACME-WH-50",
      "name": "ACME Wireless Earbuds",
      "quantity": 2,
      "unitPrice": 29.99
    }
  ],
  "subtotal": 109.97,
  "shippingCost": 0.00,
  "total": 109.97,
  "estimatedDelivery": "2026-03-26",
  "trackingUrl": "https://acme.shop/track/ORD-2026-78432"
}
```

**Parameters:**
- `items` (required): Array of items to order.
  - `productId` (required): The product ID from search results.
  - `quantity` (required): Number of units (minimum 1).
- `shipping` (required): Shipping address object.
  - `name` (required): Recipient full name.
  - `street` (required): Street address including apartment/unit number.
  - `city` (required): City name.
  - `state` (required): State, province, or region.
  - `zip` (required): ZIP or postal code.
  - `country` (required): Two-letter country code (e.g., `"US"`, `"BR"`, `"GB"`).

## Workflow

### Complete shopping flow

Follow these steps when a user wants to buy something:

1. **Understand what the user wants.** Ask clarifying questions if needed
   (size, color, budget, etc.).

2. **Search for products.** Call `GET /v1/products/search` with relevant
   keywords. This is free — search as many times as needed. Present results
   to the user with names, prices, and descriptions.

3. **Collect items.** As the user picks products, keep a running list in your
   context:
   ```
   Cart:
   - ACME-WH-100 (Wireless Headphones Pro) x1 — $49.99
   - ACME-WH-50 (Wireless Earbuds) x2 — $59.98
   Estimated subtotal: $109.97
   ```

4. **Collect shipping information.** Ask the user for:
   - Full name
   - Street address (including apt/unit if applicable)
   - City
   - State / Province
   - ZIP / Postal code
   - Country

5. **Show the order summary.** Before placing the order, present the complete
   summary: all items with quantities and prices, shipping address, and
   estimated total. Ask the user to confirm.

6. **Place the order.** Call `POST /v1/orders` with all items and shipping
   info. The server will return the exact price via the 402 response.

7. **Confirm the price with the user.** The 402 response contains the real
   total (including shipping). Show this to the user: "The total is $109.97
   USDC. Shall I proceed with payment?" **Never pay without the user's
   explicit approval.**

8. **Complete payment.** After user confirms, the x402 flow completes
   automatically. Present the order confirmation with order ID, estimated
   delivery date, and tracking URL.

### Modifying the cart before checkout

Since the cart is in your context, the user can freely add, remove, or change
quantities at any time before step 6. Just update your running list and
recalculate the estimated subtotal.

### Checking if items are in stock

Look at the `inStock` field in search results. If a product shows
`"inStock": false`, tell the user it is currently unavailable and suggest
alternatives by searching for similar products.

## Error Handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Bad request | Check input format. Ensure all required fields are present. Show the error message to the user. |
| 402 | Payment Required | Normal x402 flow — this contains the order total. Show the amount to the user before paying. |
| 403 | Insufficient funds | Tell user: "Wallet balance too low to complete this order. The total is $X. Please fund your wallet." |
| 409 | Out of stock | One or more items are no longer available. Show which items are out of stock. Remove them from the cart and ask user how to proceed. |
| 422 | Invalid address | The shipping address could not be validated. Ask the user to double-check their address details (especially ZIP code and country). |

## Pricing Summary

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/v1/products/search` | GET | Free | Search and browse products |
| `/v1/orders` | POST | Dynamic (~$25.00) | Place order — price = items + shipping |

**Price is dynamic:** The actual order total depends on which products the user
selects, quantities, and shipping destination. The estimated price of $25.00 is
a rough average — real orders can range from a few dollars to hundreds. The
exact amount is always shown in the 402 response before any payment occurs.
