---
name: human-translation
displayName: Human Translation Service
description: >-
  This skill should be used when the user asks to "translate text",
  "get a professional translation", "translate a document",
  "human translation", or needs accurate human-quality translation
  between languages.
  Professional human translation service with async delivery via polling.
version: 1.0.0
author: translatorsco
license: proprietary
base_url: https://api.translatorsco.com
type: SERVICE
pricingModel: dynamic

payment:
  asset: USDC
  networks:
    - network: stellar
      payTo: GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW
      facilitator: https://facilitator.402.md

endpoints:
  - path: /v1/jobs
    method: POST
    description: Submit text for human translation. Price depends on word count and language pair.
    priceUsdc: dynamic
    estimatedPriceUsdc: "5.00"
    deliveryMode: polling
    inputSchema:
      type: object
      properties:
        text:
          type: string
          description: The text to translate (max 10,000 words)
        sourceLanguage:
          type: string
          description: "ISO 639-1 language code (e.g. 'en', 'pt', 'ja')"
        targetLanguage:
          type: string
          description: "ISO 639-1 language code (e.g. 'es', 'de', 'zh')"
        priority:
          type: string
          enum: [standard, rush]
          default: standard
          description: "Rush doubles the price but delivers in ~1 hour"
      required: [text, sourceLanguage, targetLanguage]
    outputSchema:
      type: object
      properties:
        jobId:
          type: string
        status:
          type: string
        wordCount:
          type: integer
        price:
          type: number
        estimatedDelivery:
          type: string
        sourceLanguage:
          type: string
        targetLanguage:
          type: string

  - path: "/v1/jobs/{jobId}"
    method: GET
    description: Check the status of a translation job and retrieve the completed translation
    priceUsdc: "0"
    deliveryMode: polling
    inputSchema:
      type: object
      properties:
        jobId:
          type: string
          description: The job ID returned when the job was submitted
      required: [jobId]
    outputSchema:
      type: object
      properties:
        jobId:
          type: string
        status:
          type: string
          enum: [pending, in_progress, review, completed, failed]
        wordCount:
          type: integer
        price:
          type: number
        sourceLanguage:
          type: string
        targetLanguage:
          type: string
        translatedText:
          type: string
        translator:
          type: object
        completedAt:
          type: string

tags: [translation, languages, human, professional, localization]
category: language
rateLimit: "100/hour"
---

# Human Translation Service

Professional human translation for any language pair. Submit text, pay based
on word count, and receive a polished translation done by a certified human
translator. No API keys or accounts needed — pay per job via x402 in USDC
on the Stellar network.

**This is an async service.** Translations are done by real humans, so results
are not instant. You submit a job, pay, receive a job ID, then poll for the
result. Standard delivery is 2-24 hours depending on length. Rush delivery
is approximately 1 hour.

## How Async Delivery Works

Unlike synchronous APIs that return results immediately, this service uses
**polling-based async delivery**:

1. **Submit** — `POST /v1/jobs` with your text, source language, and target language
2. **Pay** — The server calculates the price based on word count and language
   pair, then returns it via the x402 payment flow. You pay via x402.
3. **Get job ID** — After payment, the response includes a `jobId` and
   `estimatedDelivery` timestamp
4. **Poll** — Call `GET /v1/jobs/{jobId}` periodically to check the status.
   This endpoint is free — poll as often as you like.
5. **Receive** — When `status` is `"completed"`, the `translatedText` field
   contains the finished translation

**Polling strategy:**
- For standard priority: poll every 30 minutes for the first 2 hours, then
  every 10 minutes
- For rush priority: poll every 5 minutes
- Stop polling after `estimatedDelivery` + 2 hours. If still not complete,
  tell the user to contact support.

## Payment Protocol (x402)

This service uses the x402 payment protocol. No API keys or accounts needed.
Payment is per-job in USDC on Stellar.

**How it works:**

1. Submit your translation request via `POST /v1/jobs`
2. The server counts the words, calculates the price based on language pair
   and priority, and responds with HTTP 402 (Payment Required)
3. Sign a USDC transfer authorization with your wallet — non-custodial,
   funds only move after the server verifies your signature
4. Retry the same request with the signed payment in the `X-PAYMENT` header
5. The server verifies payment, settles on-chain, assigns the job to a
   translator, and returns the job ID

**If using @402md/mcp:** Payment is handled automatically. Call the endpoint
via `use_skill` and the MCP server handles the entire 402 → sign → retry flow.

**If calling directly with code:**
```typescript
import { x402Fetch } from '@402md/x402'

// Submit and pay for a translation job
const response = await x402Fetch('https://api.translatorsco.com/v1/jobs', {
  method: 'POST',
  body: JSON.stringify({
    text: 'Hello, how are you today?',
    sourceLanguage: 'en',
    targetLanguage: 'pt',
    priority: 'standard'
  }),
  stellarSecret: process.env.STELLAR_SECRET,
  network: 'stellar'
})
const job = await response.json()
// job.jobId = "job_a1b2c3d4"
// job.estimatedDelivery = "2026-03-19T20:00:00Z"

// Poll for results (free)
const statusResponse = await fetch(
  `https://api.translatorsco.com/v1/jobs/${job.jobId}`
)
const status = await statusResponse.json()
// status.status = "completed" | "in_progress" | "pending" | ...
// status.translatedText = "Hallo, wie geht es Ihnen heute?"
```

## Authentication

No API keys, no accounts, no registration. Authentication IS the payment.
Each job is independently paid via x402. The status endpoint is free and
requires no authentication — just the job ID.

## Endpoints

### Submit Translation Job

**POST /v1/jobs** — Dynamic price (estimated ~$5.00 USDC)

Submit text for professional human translation. The price is calculated by the
server based on word count, language pair, and priority level.

**Request:**
```json
POST https://api.translatorsco.com/v1/jobs
Content-Type: application/json

{
  "text": "Artificial intelligence is transforming how businesses operate. From automating routine tasks to providing deep insights from data analysis, AI tools are becoming essential for competitive advantage. Companies that embrace these technologies early will be better positioned for the future.",
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "priority": "standard"
}
```

**402 Response (Payment Required):**
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "stellar",
      "maxAmountRequired": "2250000",
      "resource": "https://api.translatorsco.com/v1/jobs",
      "description": "Translation: 45 words, en→ja, standard priority — $2.25 USDC",
      "payTo": "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW",
      "mimeType": "application/json"
    }
  ]
}
```

**Response (200, after payment):**
```json
{
  "jobId": "job_a1b2c3d4",
  "status": "pending",
  "wordCount": 45,
  "price": 2.25,
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "priority": "standard",
  "estimatedDelivery": "2026-03-19T20:00:00Z",
  "createdAt": "2026-03-19T14:30:00Z"
}
```

**Parameters:**
- `text` (required): The text to translate. Maximum 10,000 words per job. For
  longer texts, split into multiple jobs.
- `sourceLanguage` (required): ISO 639-1 code of the source language. Examples:
  `"en"` (English), `"pt"` (Portuguese), `"ja"` (Japanese), `"de"` (German).
- `targetLanguage` (required): ISO 639-1 code of the target language.
- `priority`: `"standard"` (default, 2-24h) or `"rush"` (~1h, 2x price).

### Check Job Status

**GET /v1/jobs/{jobId}** — Free (no payment required)

Check the status of a submitted translation job. When the status is
`"completed"`, the `translatedText` field contains the finished translation.

**Request:**
```
GET https://api.translatorsco.com/v1/jobs/job_a1b2c3d4
```

**Response (200, in progress):**
```json
{
  "jobId": "job_a1b2c3d4",
  "status": "in_progress",
  "wordCount": 45,
  "price": 2.25,
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "priority": "standard",
  "estimatedDelivery": "2026-03-19T20:00:00Z",
  "translatedText": null,
  "translator": {
    "id": "tr_9182",
    "rating": 4.9
  },
  "createdAt": "2026-03-19T14:30:00Z",
  "completedAt": null
}
```

**Response (200, completed):**
```json
{
  "jobId": "job_a1b2c3d4",
  "status": "completed",
  "wordCount": 45,
  "price": 2.25,
  "sourceLanguage": "en",
  "targetLanguage": "ja",
  "priority": "standard",
  "estimatedDelivery": "2026-03-19T20:00:00Z",
  "translatedText": "人工知能はビジネスの運営方法を変革しています。日常的な業務の自動化からデータ分析による深い洞察の提供まで、AIツールは競争優位性を確保するために不可欠なものとなっています。これらの技術を早期に導入する企業は、将来に向けてより有利な立場に立つことができるでしょう。",
  "translator": {
    "id": "tr_9182",
    "name": "Yuki T.",
    "rating": 4.9,
    "certifications": ["JLPT-N1", "ATA-Certified"]
  },
  "createdAt": "2026-03-19T14:30:00Z",
  "completedAt": "2026-03-19T18:45:00Z"
}
```

**Job statuses:**
- `pending` — Job received, waiting for translator assignment
- `in_progress` — Translator is working on it
- `review` — Translation complete, undergoing quality review
- `completed` — Done. `translatedText` is available.
- `failed` — Something went wrong. Check the `error` field for details.

## Workflow

### Translate text for the user

1. Ask the user what text they want translated, and to/from which languages.
2. Estimate the cost based on word count (see pricing guide below). Tell the
   user: "This is approximately X words. The estimated cost is $Y USDC.
   Shall I submit the translation?"
3. After user confirms, call `POST /v1/jobs` with the text, source language,
   and target language.
4. The 402 response will contain the exact price. If it differs significantly
   from the estimate, inform the user before proceeding.
5. After payment, note the `jobId` and `estimatedDelivery`.
6. Tell the user: "Translation submitted (Job ID: {jobId}). Estimated
   delivery: {time}. I'll check back for the result."
7. Poll `GET /v1/jobs/{jobId}` periodically:
   - Standard priority: every 30 minutes for 2 hours, then every 10 minutes
   - Rush priority: every 5 minutes
8. When `status` is `"completed"`, present the `translatedText` to the user.
9. If `status` is `"failed"`, tell the user the error and suggest resubmitting.

### Rush translation

1. Same as above, but set `"priority": "rush"`
2. Warn the user that rush doubles the price
3. Poll more frequently (every 5 minutes)
4. Expected delivery: approximately 1 hour

### Translate a long document

1. If the text exceeds 10,000 words, split it into logical sections
   (by chapter, paragraph group, etc.)
2. Submit each section as a separate job
3. Total cost = sum of all job prices
4. Tell the user the total estimated cost before submitting any jobs
5. Track all job IDs and poll each one
6. Reassemble the translated sections in order once all jobs complete

## Pricing Guide

Pricing is based on **word count** and **language pair complexity**. The server
calculates the exact price at request time, but here are typical rates:

| Language pair | Rate per word | 100 words | 500 words | 1000 words |
|---------------|---------------|-----------|-----------|------------|
| EN ↔ ES, FR, PT, DE, IT | $0.04 | $4.00 | $20.00 | $40.00 |
| EN ↔ ZH, JA, KO | $0.05 | $5.00 | $25.00 | $50.00 |
| EN ↔ AR, RU, HI | $0.05 | $5.00 | $25.00 | $50.00 |
| Rare pairs (e.g., JA ↔ PT) | $0.07 | $7.00 | $35.00 | $70.00 |

**Rush priority** doubles the above rates.

**Minimum charge:** $1.00 USDC per job (even for very short texts).

**How to estimate:** Count the words in the source text, find the language pair
in the table, and multiply. The server's actual price may differ slightly based
on real-time translator availability, but will generally be within 10% of
these estimates.

## Error Handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Bad request | Check input format. Ensure `sourceLanguage` and `targetLanguage` are valid ISO 639-1 codes. Show error to user. |
| 402 | Payment Required | Normal x402 flow — contains the exact job price. Show amount to user before paying. |
| 403 | Insufficient funds | Tell user: "Wallet balance too low. This translation costs $X. Please fund your wallet." |
| 404 | Job not found | The `jobId` does not exist. Check for typos. |
| 413 | Text too long | The submitted text exceeds 10,000 words. Split into smaller jobs. |
| 422 | Unsupported language | The requested language pair is not supported. Show supported languages to user. |
| 429 | Rate limited | Wait 60 seconds and retry. Max 100 requests/hour. |
| 500 | Server error | Retry once after 5 seconds. If still failing, tell user. |

## Pricing Summary

| Endpoint | Method | Price | Delivery | Description |
|----------|--------|-------|----------|-------------|
| `/v1/jobs` | POST | Dynamic (~$5.00) | Async (polling) | Submit translation job |
| `/v1/jobs/{jobId}` | GET | Free | Instant | Check job status / get result |

**Cost depends on:** word count, language pair, and priority level. The exact
price is always shown in the 402 response before any payment occurs. Always
confirm the price with the user before proceeding.
