---
name: weather-api
displayName: Weather API
description: >-
  This skill should be used when the user asks about "weather",
  "temperature", "forecast", "current conditions", or needs
  meteorological data for any location worldwide.
  Real-time weather data API with current conditions and multi-day forecasts.
version: 1.0.0
author: weatherco
license: proprietary
base_url: https://api.weatherco.com
type: API
pricingModel: fixed

payment:
  asset: USDC
  networks:
    - network: stellar
      payTo: GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW
      facilitator: https://facilitator.402.md

endpoints:
  - path: /v1/current
    method: POST
    description: Get current weather conditions for a location
    priceUsdc: "0.001"
    inputSchema:
      type: object
      properties:
        location:
          type: string
          description: "City name, address, or coordinates (lat,lon)"
        units:
          type: string
          enum: [metric, imperial]
          default: metric
      required: [location]
    outputSchema:
      type: object
      properties:
        location:
          type: string
        temperature:
          type: number
        feelsLike:
          type: number
        humidity:
          type: integer
        description:
          type: string
        windSpeed:
          type: number
        updatedAt:
          type: string

  - path: /v1/forecast
    method: POST
    description: Get multi-day weather forecast for a location
    priceUsdc: "0.005"
    inputSchema:
      type: object
      properties:
        location:
          type: string
          description: "City name, address, or coordinates (lat,lon)"
        days:
          type: integer
          minimum: 1
          maximum: 14
          default: 7
        units:
          type: string
          enum: [metric, imperial]
          default: metric
      required: [location]
    outputSchema:
      type: object
      properties:
        location:
          type: string
        forecast:
          type: array
          items:
            type: object
            properties:
              date:
                type: string
              high:
                type: number
              low:
                type: number
              description:
                type: string
              precipitationChance:
                type: integer

tags: [weather, forecast, temperature, geolocation, climate]
category: data
sla: "99.9%"
rateLimit: "1000/hour"
---

# Weather API

Real-time weather data for any location worldwide. Get current conditions or
multi-day forecasts. No API keys or accounts needed — pay per request via
x402 in USDC on the Stellar network.

## Payment Protocol (x402)

This API uses the x402 payment protocol. No API keys or accounts needed.
Payment is per-request in USDC on Stellar.

**How it works:**

1. Make a normal HTTP request to any endpoint below
2. The server responds with HTTP 402 (Payment Required) and a JSON body
   containing payment requirements (amount, recipient address, network)
3. Sign a USDC transfer authorization with your wallet — non-custodial,
   funds only move after the server verifies your signature
4. Retry the same request with the signed payment in the `X-PAYMENT` header
5. The server verifies payment, settles on-chain atomically, and returns the result

**If using @402md/mcp:** Payment is handled automatically. Call the endpoint
via `use_skill` and the MCP server handles the entire 402 → sign → retry flow.

**If calling directly with code:**
```typescript
import { x402Fetch } from '@402md/x402'

const response = await x402Fetch('https://api.weatherco.com/v1/current', {
  method: 'POST',
  body: JSON.stringify({ location: 'New York' }),
  stellarSecret: process.env.STELLAR_SECRET,
  network: 'stellar'
})
```

## Authentication

No API keys, no accounts, no registration. Authentication IS the payment.
Each request is independently paid via x402. The agent's wallet signature
serves as both authentication and payment authorization.

## Endpoints

### Get Current Weather

**POST /v1/current** — $0.001 USDC per call

Returns current weather conditions for any location worldwide, including
temperature, humidity, wind speed, and a human-readable description.

**Request:**
```json
POST https://api.weatherco.com/v1/current
Content-Type: application/json

{
  "location": "New York, NY",
  "units": "metric"
}
```

**Response (200):**
```json
{
  "location": "New York, NY, US",
  "temperature": 24.5,
  "feelsLike": 26.1,
  "humidity": 72,
  "description": "Partly cloudy",
  "windSpeed": 12.3,
  "windDirection": "NE",
  "pressure": 1013,
  "visibility": 10,
  "uvIndex": 6,
  "updatedAt": "2026-03-19T14:30:00Z"
}
```

**Parameters:**
- `location` (required): City name, full address, or coordinates as `"lat,lon"`. Examples: `"London"`, `"Tokyo, Japan"`, `"-23.55,-46.63"`.
- `units`: Temperature and wind units. `metric` (Celsius, km/h) or `imperial` (Fahrenheit, mph). Default: `metric`.

### Get Weather Forecast

**POST /v1/forecast** — $0.005 USDC per call

Returns a multi-day weather forecast with daily high/low temperatures,
conditions, and precipitation probability.

**Request:**
```json
POST https://api.weatherco.com/v1/forecast
Content-Type: application/json

{
  "location": "New York, NY",
  "days": 7,
  "units": "imperial"
}
```

**Response (200):**
```json
{
  "location": "New York, NY, United States",
  "forecast": [
    {
      "date": "2026-03-19",
      "high": 58.2,
      "low": 42.1,
      "description": "Sunny",
      "precipitationChance": 5,
      "windSpeed": 8.4,
      "humidity": 45
    },
    {
      "date": "2026-03-20",
      "high": 55.0,
      "low": 40.8,
      "description": "Partly cloudy",
      "precipitationChance": 20,
      "windSpeed": 12.1,
      "humidity": 52
    },
    {
      "date": "2026-03-21",
      "high": 50.3,
      "low": 38.5,
      "description": "Rain showers",
      "precipitationChance": 75,
      "windSpeed": 15.6,
      "humidity": 78
    },
    {
      "date": "2026-03-22",
      "high": 52.1,
      "low": 39.0,
      "description": "Overcast",
      "precipitationChance": 30,
      "windSpeed": 10.2,
      "humidity": 65
    },
    {
      "date": "2026-03-23",
      "high": 56.8,
      "low": 41.3,
      "description": "Mostly sunny",
      "precipitationChance": 10,
      "windSpeed": 7.5,
      "humidity": 48
    },
    {
      "date": "2026-03-24",
      "high": 60.1,
      "low": 44.0,
      "description": "Sunny",
      "precipitationChance": 5,
      "windSpeed": 6.2,
      "humidity": 42
    },
    {
      "date": "2026-03-25",
      "high": 62.5,
      "low": 45.8,
      "description": "Sunny",
      "precipitationChance": 0,
      "windSpeed": 5.8,
      "humidity": 38
    }
  ]
}
```

**Parameters:**
- `location` (required): City name, full address, or coordinates as `"lat,lon"`.
- `days`: Number of forecast days (1-14). Default: `7`.
- `units`: Temperature and wind units. `metric` or `imperial`. Default: `metric`.

## Workflow

### Get current weather for a city

1. Call `POST /v1/current` with `{ "location": "New York" }` ($0.001)
2. Present the temperature, conditions, and humidity to the user
3. If the user wants a forecast, ask how many days, then call `/v1/forecast`

### Get a multi-day forecast

1. Call `POST /v1/forecast` with the location and desired number of days ($0.005)
2. Present results in a readable format (table or day-by-day summary)
3. Highlight any days with high precipitation chance

### Compare weather across cities

1. Call `POST /v1/current` once per city (each call costs $0.001)
2. Present results in a comparison table
3. Total cost = $0.001 x number of cities — confirm with user first

### Plan a trip

1. Ask the user for destination and travel dates
2. Call `POST /v1/forecast` for the destination ($0.005)
3. Summarize weather for the travel period
4. Flag any days with rain or extreme temperatures

**Important:** Always tell the user the cost before making any call. For
multiple calls, state the total cost upfront and wait for confirmation.

## Error Handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Invalid input | Check that `location` is valid. Show error message to user. |
| 402 | Payment Required | Normal x402 flow — handled automatically by @402md/x402 or MCP. |
| 403 | Insufficient funds | Tell user: "Wallet balance too low. Fund your wallet to continue." |
| 404 | Location not found | The location could not be resolved. Ask user to be more specific. |
| 429 | Rate limited | Wait 60 seconds and retry once. Max 1000 requests/hour. |
| 500 | Server error | Retry once after 5 seconds. If still failing, tell user. |

## Pricing Summary

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/v1/current` | POST | $0.001 | Current weather conditions |
| `/v1/forecast` | POST | $0.005 | Multi-day forecast (up to 14 days) |

**Cost examples:**
- Current weather for 1 city: $0.001
- 7-day forecast for 1 city: $0.005
- Current weather for 5 cities: $0.005
- Current + forecast for 1 city: $0.006
- Compare forecasts for 3 cities: $0.015
