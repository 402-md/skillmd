---
name: create-paid-skill
displayName: Create Paid AI Skill (SKILL.md + x402)
description: >-
  Use this skill when the user asks to "create a paid skill", "monetize an API",
  "create a SKILL.md", "set up x402 payments", "make a paid API for agents",
  "create an agent skill with payments", "build a skill for skills.sh",
  or wants to create a service that AI agents can discover and pay for autonomously.
  Guides the user step-by-step through creating a SKILL.md file with the 402md
  specification, including payment configuration, endpoint definitions, and
  agent-ready documentation.
version: 1.0.0
author: 402md
license: MIT
type: SKILL
tags:
  - skill-creation
  - monetization
  - x402
  - payments
  - api
  - agents
  - skillmd
category: developer-tools
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
---

# Create a Paid AI Skill (SKILL.md + x402)

You are a specialist in creating SKILL.md files — the universal descriptor format
for AI agent capabilities. You help users create skills that AI agents can discover,
understand, and pay for autonomously using the x402 payment protocol.

## What is SKILL.md?

SKILL.md is an open format for describing capabilities that AI agents can discover
and use. A single markdown file, readable by both humans and machines, serves as
the universal descriptor for the agent economy.

- **Human-readable**: It's just a markdown file. Developers read it, edit it, commit it.
- **Machine-parseable**: YAML frontmatter provides structured metadata.
- **Payment-native**: First-class support for per-request payments in USDC via x402.
- **Framework-agnostic**: Works with MCP, A2A, OpenAPI, Claude Code, and any agent framework.
- **Backwards-compatible**: Any valid Anthropic Claude Code skill is a valid SKILL.md.

Reference implementation: `npm install @402md/skillmd`
Full specification: https://github.com/402-md/skillmd/blob/main/SPEC.md

## Step-by-Step Process

When the user asks to create a paid skill, follow these steps IN ORDER:

### Step 1: Understand the Service

Ask the user:
1. **What does your API/service do?** (e.g., "scrapes websites", "generates images", "translates text")
2. **What endpoints does it have?** (method, path, what each does)
3. **What should each call cost?** (in USDC — typical range: $0.001 to $0.10 per call)
4. **What blockchain network?** Options: `stellar`, `base`, `stellar-testnet`, `base-sepolia`
5. **What is your wallet address?** (Stellar G-address or EVM 0x-address for receiving payments)
6. **What is the base URL?** (e.g., `https://api.myservice.com`)

If the user already has an OpenAPI spec or existing API, read it first to extract endpoints automatically.

### Step 2: Generate the SKILL.md

Create a `SKILL.md` file with this structure:

```
---
[YAML frontmatter - structured metadata]
---

[Markdown body - agent instructions and documentation]
```

#### Frontmatter Template

```yaml
---
name: {kebab-case-name}
displayName: {Human Readable Name}
description: >-
  This skill should be used when the user asks to "{trigger phrase 1}",
  "{trigger phrase 2}", "{trigger phrase 3}", or needs {general description}.
  {One-line summary of what the API does}.
version: 1.0.0
author: {author-name}
license: {MIT | proprietary | etc}
base_url: {https://api.example.com}
type: API

payment:
  asset: USDC
  networks:
    - network: {stellar | base | stellar-testnet | base-sepolia}
      payTo: {wallet-address}
      facilitator: https://facilitator.402.md

endpoints:
  - path: /v1/{resource}
    method: POST
    description: {What this endpoint does}
    priceUsdc: "{price}"
    inputSchema:
      type: object
      properties:
        {param}:
          type: string
          description: {param description}
      required: [{required-params}]
    outputSchema:
      type: object
      properties:
        {field}:
          type: string

tags: [{relevant, discovery, tags}]
category: {primary-category}
---
```

#### Markdown Body Template

The body MUST teach agents how to use the API. Write it in this order:

```markdown
# {Skill Name}

{One paragraph: what it does, when to use it, no API keys needed.}

## Payment Protocol (x402)

This API uses the x402 payment protocol. No API keys or accounts needed.
Payment is per-request in USDC on {network}.

**How it works:**

1. Make a normal HTTP request to any endpoint
2. The server responds with HTTP 402 (Payment Required) and a JSON body
   containing payment requirements (amount, recipient address, network)
3. Sign a USDC transfer authorization with your wallet (non-custodial,
   no funds leave your wallet until verified)
4. Retry the same request with the signed payment in the `X-PAYMENT` header
5. The server verifies the payment, settles on-chain, and returns the result

**If using @402md/mcp:** Payment is handled automatically. Just call the
endpoint via `use_skill` and the MCP server handles steps 2-5.

**If calling directly:**
\`\`\`typescript
import { x402Fetch } from '@402md/x402'

const response = await x402Fetch('{base_url}{path}', {
  method: 'POST',
  body: JSON.stringify({ /* params */ }),
  stellarSecret: process.env.STELLAR_SECRET,
  network: '{network}'
})
\`\`\`

## Authentication

No API keys, no accounts, no registration. Authentication IS the payment.
Each request is independently paid via x402.

## Endpoints

### {Endpoint Name}

**{METHOD} {path}** — ${price} USDC

{Description of what this endpoint does.}

**Request:**
\`\`\`json
{
  "param": "value"
}
\`\`\`

**Response:**
\`\`\`json
{
  "field": "value"
}
\`\`\`

**Parameters:**
- `param` (required): Description.
- `optionalParam`: Description. Default: `value`.

## Workflow

### {Common Use Case}

1. Call `{METHOD} {path}` with `{ "param": "value" }` (${price})
2. {Next step}
3. Always tell the user the cost before making the call

## Error Handling

| Status | Meaning | What to do |
|--------|---------|------------|
| 400 | Bad request | Check input format. Show error to user. |
| 402 | Payment required | Normal x402 flow — handled automatically. |
| 403 | Insufficient funds | Tell user to fund their wallet. |
| 429 | Rate limited | Wait 60 seconds and retry once. |
| 500 | Server error | Retry once after 5 seconds. |

## Pricing Summary

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `{path}` | {METHOD} | ${price} | {description} |
```

### Step 3: Validate the SKILL.md

After generating, validate it using the @402md/skillmd library:

```typescript
import { validateSkillMd } from '@402md/skillmd'
import { readFileSync } from 'fs'

const content = readFileSync('SKILL.md', 'utf-8')
const result = validateSkillMd(content)

if (!result.valid) {
  console.error('Errors:', result.errors)
}
if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings)
}
```

Or validate manually by checking:
- [ ] `name` is kebab-case and matches `^[a-z0-9][a-z0-9_-]*$`
- [ ] `description` is present and under 2000 chars
- [ ] `base_url` is a valid URL (required when endpoints exist)
- [ ] `payment.networks` has at least one valid network config
- [ ] Each network has a valid `payTo` address
- [ ] Each endpoint has `path` (starts with `/`), `method`, `description`, `priceUsdc`
- [ ] `priceUsdc` matches `^\d+(\.\d+)?$` (decimal string like `"0.005"`)
- [ ] No duplicate `{method} {path}` combinations

### Step 4: Explain Publishing Options

Tell the user about these publishing channels:

1. **GitHub Repository** (for skills.sh):
   - Create a public repo with the SKILL.md at the root or inside `skills/{skill-name}/`
   - Anyone can install with: `npx skills add {owner}/{repo}`
   - It will appear on https://skills.sh for discovery

2. **npm Package**:
   - Include SKILL.md at the package root
   - `npm install @{scope}/{skill-name}`

3. **402.md Marketplace**:
   - Register at https://402.md/marketplace
   - Your skill becomes discoverable via the `@402md/mcp` search tool

4. **Direct URL**:
   - Host SKILL.md at `https://yourdomain.com/SKILL.md`
   - Agents can fetch and parse it directly

5. **A2A Discovery**:
   - Serve `GET /.well-known/agent-card.json` (converted from SKILL.md)
   - Compatible with Google A2A protocol

## Validation Rules Reference

### Errors (MUST fix)

| Rule | Description |
|------|-------------|
| `MISSING_NAME` | Name is required |
| `INVALID_NAME` | Must be kebab-case |
| `MISSING_DESCRIPTION` | Description is required |
| `MISSING_BASE_URL` | Required when endpoints present |
| `MISSING_PAYMENT` | Required when endpoints present |
| `MISSING_NETWORKS` | At least one network config required |
| `INVALID_NETWORK` | Must be: stellar, base, stellar-testnet, base-sepolia |
| `MISSING_PAY_TO` | Recipient address required for each network |
| `INVALID_PATH` | Must start with `/` |
| `INVALID_METHOD` | Must be: GET, POST, PUT, DELETE, PATCH |
| `INVALID_PRICE` | Must be decimal string like `"0.005"` |

### Warnings (SHOULD fix)

| Rule | Description |
|------|-------------|
| `MISSING_VERSION` | Recommended for published skills |
| `MISSING_TAGS` | Helps with discovery |
| `TOO_MANY_TAGS` | Maximum 20 tags |

## Skill Type Reference

| Type | When to use |
|------|-------------|
| `API` | RESTful API with paid endpoints (most common) |
| `SAAS` | SaaS product with API access |
| `PRODUCT` | Digital product (dataset, model, etc.) |
| `SERVICE` | Human-in-the-loop or async service |
| `SUBSCRIPTION` | Recurring access model |
| `CONTENT` | Static content (docs, reports) |
| `SKILL` | Pure agent instruction, no paid endpoints |

## Payment Network Reference

| Network | Use for |
|---------|---------|
| `stellar` | Production — Stellar mainnet, low fees |
| `base` | Production — Base L2 (Coinbase), EVM compatible |
| `stellar-testnet` | Testing — free testnet USDC |
| `base-sepolia` | Testing — Base Sepolia testnet |

## Pricing Guidelines

| Service type | Typical price range |
|-------------|-------------------|
| Simple data lookup | $0.001 - $0.005 |
| Content extraction | $0.005 - $0.02 |
| AI/ML inference | $0.01 - $0.10 |
| Image generation | $0.02 - $0.20 |
| Complex processing | $0.05 - $0.50 |

Price low enough that agents don't hesitate, high enough to cover your costs.
USDC has 7 decimals on Stellar, 6 on Base.

## Important Rules

1. **Always show the full SKILL.md** to the user after generating it
2. **Always validate** before recommending publication
3. **Include concrete request/response examples** in every endpoint section — agents cannot use abstract descriptions
4. **Include the x402 payment section** — no LLM has been trained on x402, the body is how agents learn
5. **Use trigger phrases** in the description for Claude Code auto-invocation
6. **Test with testnet first** — recommend `stellar-testnet` or `base-sepolia` for development
7. **Suggest a sandbox URL** if the user can provide a free test endpoint
