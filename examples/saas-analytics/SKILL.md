---
name: analytics-pro
displayName: Analytics Pro
description: >-
  This skill should be used when the user asks about "website analytics",
  "traffic data", "conversion rates", "page views", "visitor stats",
  or needs web analytics and conversion tracking data.
  Subscription-based analytics platform with traffic and conversion endpoints.
version: 1.0.0
author: analyticsco
license: proprietary
base_url: https://api.analyticspro.com
type: SUBSCRIPTION
pricingModel: subscription

auth:
  method: wallet-signature
  loginEndpoint: /v1/auth

payment:
  asset: USDC
  networks:
    - network: base
      payTo: "0xabcdef1234567890abcdef1234567890abcdef12"
      facilitator: https://facilitator.402.md

endpoints:
  - path: /v1/subscribe
    method: POST
    description: Purchase a 30-day subscription to the analytics platform
    priceUsdc: "10.00"
    duration: "30d"
    inputSchema:
      type: object
      properties:
        plan:
          type: string
          enum: [pro]
          default: pro
      required: []
    outputSchema:
      type: object
      properties:
        subscriptionId:
          type: string
        walletAddress:
          type: string
        plan:
          type: string
        expiresAt:
          type: string
        status:
          type: string

  - path: /v1/auth
    method: POST
    description: Authenticate with wallet signature to get a session JWT
    priceUsdc: "0"
    inputSchema:
      type: object
      properties:
        walletAddress:
          type: string
          description: The wallet address that paid for the subscription
        signature:
          type: string
          description: "Signed message: 'Login: {ISO-timestamp}'"
        message:
          type: string
          description: "The message that was signed, e.g. 'Login: 2026-03-19T14:00:00Z'"
      required: [walletAddress, signature, message]
    outputSchema:
      type: object
      properties:
        token:
          type: string
          description: JWT valid for the remaining subscription period
        expiresAt:
          type: string

  - path: /v1/traffic
    method: GET
    description: Get traffic data (page views, unique visitors, sessions) for a date range
    priceUsdc: "0"
    inputSchema:
      type: object
      properties:
        siteId:
          type: string
          description: Site identifier
        startDate:
          type: string
          description: "Start date in YYYY-MM-DD format"
        endDate:
          type: string
          description: "End date in YYYY-MM-DD format"
        granularity:
          type: string
          enum: [day, week, month]
          default: day
      required: [siteId, startDate, endDate]
    outputSchema:
      type: object
      properties:
        siteId:
          type: string
        period:
          type: object
        totals:
          type: object
        timeseries:
          type: array

  - path: /v1/conversions
    method: GET
    description: Get conversion funnel data and event tracking for a date range
    priceUsdc: "0"
    inputSchema:
      type: object
      properties:
        siteId:
          type: string
          description: Site identifier
        startDate:
          type: string
          description: "Start date in YYYY-MM-DD format"
        endDate:
          type: string
          description: "End date in YYYY-MM-DD format"
        eventName:
          type: string
          description: "Filter by specific event (e.g. 'signup', 'purchase')"
      required: [siteId, startDate, endDate]
    outputSchema:
      type: object
      properties:
        siteId:
          type: string
        period:
          type: object
        events:
          type: array
        conversionRate:
          type: number

tags: [analytics, traffic, conversions, saas, subscription, web]
category: analytics
sla: "99.9%"
rateLimit: "5000/hour"
---

# Analytics Pro

Subscription-based web analytics platform. Pay once for 30 days of access,
then query traffic and conversion data freely for the duration of the
subscription. No API keys or accounts needed — your wallet address IS your
identity.

## Subscription Flow Overview

This is a **subscription** service, not a per-call API. The flow is:

1. **Subscribe** — Pay $10.00 USDC via x402 to activate a 30-day subscription.
   The server records your wallet address as a subscriber.
2. **Authenticate** — Sign a message with your wallet to prove ownership. The
   server verifies the signature locally (free, no facilitator involved) and
   returns a JWT.
3. **Use data endpoints** — Call `/v1/traffic` and `/v1/conversions` freely
   using the JWT in the `Authorization` header. No additional payments.
4. **Renew** — When the subscription expires, call `/v1/subscribe` again to
   pay for another 30 days.

**Key concept: wallet address = identity.** When you pay via x402, the server
learns your wallet address from the payment. When you authenticate, you sign a
message with the same wallet. The server verifies the signature locally using
standard cryptography — this is a free operation that does NOT involve the
facilitator or the blockchain. The facilitator is only involved during the
initial subscription payment.

## Payment Protocol (x402)

The subscription payment uses the x402 protocol. No API keys or accounts needed.

**How it works (subscription payment):**

1. Call `POST /v1/subscribe` with `{ "plan": "pro" }`
2. The server responds with HTTP 402 (Payment Required) with amount $10.00
3. Sign a USDC transfer authorization with your wallet — non-custodial,
   funds only move after the server verifies your signature
4. Retry the same request with the signed payment in the `X-PAYMENT` header
5. The server verifies payment, settles on-chain, and activates the subscription
6. The response includes your `walletAddress` and `expiresAt` timestamp

**After subscribing, data endpoints are free.** You authenticate with a wallet
signature (not x402) and use the JWT for all subsequent calls.

**If using @402md/mcp:** The subscription payment is handled automatically via
`use_skill`. After subscribing, you will need to authenticate via `/v1/auth`
to get a JWT for data endpoints.

**If calling directly with code:**
```typescript
import { x402Fetch } from '@402md/x402'

// Step 1: Subscribe (x402 payment)
const subResponse = await x402Fetch('https://api.analyticspro.com/v1/subscribe', {
  method: 'POST',
  body: JSON.stringify({ plan: 'pro' }),
  evmPrivateKey: process.env.EVM_PRIVATE_KEY,
  network: 'base'
})
const subscription = await subResponse.json()

// Step 2: Authenticate (free wallet signature)
const message = `Login: ${new Date().toISOString()}`
const signature = await wallet.signMessage(message)

const authResponse = await fetch('https://api.analyticspro.com/v1/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: wallet.address,
    signature,
    message
  })
})
const { token } = await authResponse.json()

// Step 3: Use data endpoints freely with JWT
const trafficResponse = await fetch(
  'https://api.analyticspro.com/v1/traffic?siteId=my-site&startDate=2026-03-01&endDate=2026-03-19',
  { headers: { 'Authorization': `Bearer ${token}` } }
)
```

## Authentication

This service uses a **two-layer** authentication model:

1. **x402 payment** — for the subscription payment only. The facilitator
   verifies and settles the USDC transfer on-chain.
2. **Wallet signature** — for all subsequent requests. You sign a message
   locally to prove you own the wallet that paid. The server verifies the
   signature using standard cryptographic verification. **This is free and
   local — it does NOT involve the facilitator or blockchain.**

After authenticating, the server returns a JWT that is valid for the remaining
subscription period. Include it in the `Authorization: Bearer {token}` header
on all data endpoint requests.

## Endpoints

### Subscribe

**POST /v1/subscribe** — $10.00 USDC (30-day access)

Purchase a 30-day subscription. After payment, your wallet address is
registered as an active subscriber.

**Request:**
```json
POST https://api.analyticspro.com/v1/subscribe
Content-Type: application/json

{
  "plan": "pro"
}
```

**Response (200, after x402 payment):**
```json
{
  "subscriptionId": "sub_8f3a2b1c",
  "walletAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "plan": "pro",
  "expiresAt": "2026-04-18T14:30:00Z",
  "status": "active"
}
```

### Authenticate

**POST /v1/auth** — Free

Prove wallet ownership by signing a timestamped message. Returns a JWT
for accessing data endpoints.

**Request:**
```json
POST https://api.analyticspro.com/v1/auth
Content-Type: application/json

{
  "walletAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "signature": "0x4a8b9c...signed-bytes...",
  "message": "Login: 2026-03-19T14:30:00Z"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXQiOiIweGFiYy4uLiIsImV4cCI6MTc0NTMzMjIwMH0.signature",
  "expiresAt": "2026-04-18T14:30:00Z"
}
```

**How to sign the message:**
1. Create a message string: `"Login: {current-ISO-timestamp}"`
2. Sign it with the private key of the wallet that paid for the subscription
3. Send the wallet address, signature, and original message to this endpoint
4. The server verifies the signature locally (free, ~1ms) and checks that
   the wallet has an active subscription

**Important:** The timestamp in the message must be within 5 minutes of the
server's current time. This prevents replay attacks.

### Get Traffic Data

**GET /v1/traffic** — Free (requires active subscription + JWT)

Returns page views, unique visitors, and session data for a site and date
range. Requires a valid JWT in the `Authorization` header.

**Request:**
```
GET https://api.analyticspro.com/v1/traffic?siteId=my-site&startDate=2026-03-01&endDate=2026-03-19&granularity=day
Authorization: Bearer eyJhbGciOiJFUzI1NiIs...
```

**Response (200):**
```json
{
  "siteId": "my-site",
  "period": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-19"
  },
  "totals": {
    "pageViews": 45230,
    "uniqueVisitors": 12847,
    "sessions": 18392,
    "avgSessionDuration": 184,
    "bounceRate": 0.42
  },
  "timeseries": [
    {
      "date": "2026-03-01",
      "pageViews": 2105,
      "uniqueVisitors": 612,
      "sessions": 834
    },
    {
      "date": "2026-03-02",
      "pageViews": 2340,
      "uniqueVisitors": 698,
      "sessions": 921
    },
    {
      "date": "2026-03-03",
      "pageViews": 1890,
      "uniqueVisitors": 543,
      "sessions": 712
    }
  ]
}
```

**Query parameters:**
- `siteId` (required): Your site identifier.
- `startDate` (required): Start date in `YYYY-MM-DD` format.
- `endDate` (required): End date in `YYYY-MM-DD` format.
- `granularity`: Aggregation period. `day` (default), `week`, or `month`.

### Get Conversion Data

**GET /v1/conversions** — Free (requires active subscription + JWT)

Returns conversion events and funnel data for a site and date range.
Requires a valid JWT in the `Authorization` header.

**Request:**
```
GET https://api.analyticspro.com/v1/conversions?siteId=my-site&startDate=2026-03-01&endDate=2026-03-19&eventName=signup
Authorization: Bearer eyJhbGciOiJFUzI1NiIs...
```

**Response (200):**
```json
{
  "siteId": "my-site",
  "period": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-19"
  },
  "events": [
    {
      "name": "signup",
      "count": 342,
      "conversionRate": 0.027,
      "avgValue": 0
    }
  ],
  "funnel": [
    { "step": "landing_page", "visitors": 12847 },
    { "step": "signup_form", "visitors": 1834 },
    { "step": "signup_complete", "visitors": 342 },
    { "step": "first_purchase", "visitors": 89 }
  ],
  "conversionRate": 0.027
}
```

**Query parameters:**
- `siteId` (required): Your site identifier.
- `startDate` (required): Start date in `YYYY-MM-DD` format.
- `endDate` (required): End date in `YYYY-MM-DD` format.
- `eventName`: Filter by a specific event name. Omit to get all events.

## Workflow

### First-time setup (subscribe + authenticate)

1. Tell the user: "Analytics Pro requires a subscription. It costs $10.00 USDC
   for 30 days of unlimited access. Shall I subscribe?"
2. After user confirms, call `POST /v1/subscribe` with `{ "plan": "pro" }` ($10.00)
3. The x402 payment flow completes automatically
4. Save the `walletAddress` and `expiresAt` from the response
5. Authenticate: sign the message `"Login: {timestamp}"` with your wallet
6. Call `POST /v1/auth` with the wallet address, signature, and message
7. Save the returned JWT — use it for all data requests

### Query traffic data

1. Ensure you have a valid JWT (authenticate if needed)
2. Call `GET /v1/traffic` with `siteId`, `startDate`, `endDate`, and
   `granularity` — include the JWT in the `Authorization` header
3. Present the data to the user in a readable format (table, summary, or chart description)
4. This call is free — no payment needed

### Query conversion data

1. Ensure you have a valid JWT (authenticate if needed)
2. Call `GET /v1/conversions` with `siteId`, `startDate`, `endDate`, and
   optionally `eventName` — include the JWT in the `Authorization` header
3. Present the funnel steps and conversion rates to the user
4. This call is free — no payment needed

### Renew an expired subscription

1. If a data endpoint returns 401 (Unauthorized), the subscription may have
   expired
2. Tell the user: "Your subscription expired. Renewing costs $10.00 USDC
   for another 30 days. Shall I renew?"
3. After confirmation, call `POST /v1/subscribe` again
4. Re-authenticate with `/v1/auth` to get a new JWT

## Error Handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Bad request | Check query parameters. Show error message to user. |
| 401 | Unauthorized | JWT is missing, expired, or invalid. Re-authenticate with `/v1/auth`. If auth also fails, subscription may have expired — offer to renew. |
| 402 | Payment Required | Normal x402 flow for subscription payment — handled automatically. |
| 403 | Insufficient funds | Tell user: "Wallet balance too low. Fund your wallet with at least $10.00 USDC to subscribe." |
| 429 | Rate limited | Wait 60 seconds and retry once. Max 5000 requests/hour. |
| 500 | Server error | Retry once after 5 seconds. If still failing, tell user. |

## Pricing Summary

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/v1/subscribe` | POST | $10.00 | 30-day subscription |
| `/v1/auth` | POST | Free | Wallet signature authentication |
| `/v1/traffic` | GET | Free | Traffic data (requires subscription) |
| `/v1/conversions` | GET | Free | Conversion data (requires subscription) |

**Total cost:** $10.00 USDC per 30 days for unlimited data access. No
per-query charges. The only payment event is the subscription — all data
endpoints are free after that.
