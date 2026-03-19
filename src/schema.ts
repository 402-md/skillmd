import {
  SKILL_TYPES,
  HTTP_METHODS,
  PAYMENT_NETWORKS,
  PRICING_MODELS,
  DELIVERY_MODES
} from './constants'

/**
 * JSON Schema for SKILL.md v2 frontmatter validation.
 * Can be used with any JSON Schema validator (ajv, zod, etc).
 *
 * Enums are derived from the shared constants in constants.ts
 * so they stay in sync with the parser and validator.
 */
export const SKILLMD_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'SKILL.md Frontmatter',
  description: 'Schema for the YAML frontmatter in a SKILL.md file',
  type: 'object',
  required: ['name', 'description'],
  properties: {
    name: {
      type: 'string',
      pattern: '^[a-z0-9][a-z0-9_-]*$',
      minLength: 1,
      maxLength: 100,
      description: 'Unique skill identifier (kebab-case)'
    },
    displayName: {
      type: 'string',
      maxLength: 200,
      description: 'Human-readable name'
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 2000,
      description:
        'What this skill does. For agent-invoked skills, use trigger phrases.'
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+',
      description: 'Semantic version'
    },
    author: {
      type: 'string',
      maxLength: 100
    },
    license: {
      type: 'string',
      description: 'License identifier (e.g. MIT, proprietary)'
    },
    base_url: {
      type: 'string',
      format: 'uri',
      description: 'Base URL of the API'
    },
    type: {
      type: 'string',
      enum: [...SKILL_TYPES],
      default: 'API'
    },
    payment: {
      type: 'object',
      required: ['networks'],
      properties: {
        networks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['network', 'payTo'],
            properties: {
              network: {
                type: 'string',
                enum: [...PAYMENT_NETWORKS],
                description: 'Payment network identifier'
              },
              payTo: {
                type: 'string',
                minLength: 1,
                description: 'Recipient address for this network'
              },
              facilitator: {
                type: 'string',
                format: 'uri',
                description: 'Facilitator service URL for this network'
              }
            },
            additionalProperties: false
          },
          minItems: 1,
          description:
            'Supported payment networks with per-network configuration'
        },
        asset: {
          type: 'string',
          default: 'USDC',
          description: 'Payment asset'
        }
      },
      additionalProperties: false
    },
    endpoints: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'method', 'description', 'priceUsdc'],
        properties: {
          path: {
            type: 'string',
            pattern: '^/',
            description: 'Endpoint path (must start with /)'
          },
          method: {
            type: 'string',
            enum: [...HTTP_METHODS]
          },
          description: {
            type: 'string',
            minLength: 1
          },
          priceUsdc: {
            type: 'string',
            pattern: '^(\\d+(\\.\\d+)?|dynamic)$',
            description:
              'Price in USDC (e.g. "0.001") or "dynamic" for variable pricing'
          },
          estimatedPriceUsdc: {
            type: 'string',
            pattern: '^\\d+(\\.\\d+)?$',
            description: 'Estimated price for dynamic endpoints (e.g. "25.00")'
          },
          duration: {
            type: 'string',
            pattern: '^\\d+(m|h|d|y)$',
            description: 'Access duration (e.g. "30d", "1h", "1y")'
          },
          deliveryMode: {
            type: 'string',
            enum: [...DELIVERY_MODES],
            description: 'How results are delivered: sync, polling, or webhook'
          },
          inputSchema: {
            type: 'object',
            description: 'JSON Schema for request body'
          },
          outputSchema: {
            type: 'object',
            description: 'JSON Schema for response body'
          }
        },
        additionalProperties: false
      },
      minItems: 1
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 20
    },
    category: {
      type: 'string'
    },
    sla: {
      type: 'string',
      description: 'Uptime guarantee (e.g. "99.9%")'
    },
    rateLimit: {
      type: 'string',
      description: 'Rate limit (e.g. "1000/hour")'
    },
    sandbox: {
      type: 'string',
      format: 'uri',
      description: 'Free test endpoint URL'
    },
    pricingModel: {
      type: 'string',
      enum: [...PRICING_MODELS],
      description: 'Payment model: fixed, dynamic, subscription, cart, free'
    },
    auth: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description: 'Authentication method (e.g. "wallet-signature")'
        },
        loginEndpoint: {
          type: 'string',
          pattern: '^/',
          description: 'Endpoint for wallet-based authentication'
        }
      },
      required: ['method'],
      additionalProperties: false
    },
    'allowed-tools': {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      description:
        'Tools the skill is allowed to use (Anthropic Claude Code compatibility)'
    },
    allowedTools: {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      description: 'Alias for allowed-tools (camelCase)'
    }
  },
  additionalProperties: true
} as const
