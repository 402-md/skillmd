import type {
  HttpMethod,
  PaymentNetwork,
  SkillType,
  PricingModel,
  DeliveryMode
} from './types'

export const SKILL_TYPES: readonly SkillType[] = [
  'API',
  'SAAS',
  'PRODUCT',
  'SERVICE',
  'SUBSCRIPTION',
  'CONTENT',
  'SKILL'
] as const

export const HTTP_METHODS: readonly HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH'
] as const

export const PAYMENT_NETWORKS: readonly PaymentNetwork[] = [
  'stellar',
  'base',
  'base-sepolia',
  'stellar-testnet'
] as const

export const SKILL_TYPES_SET = new Set<string>(SKILL_TYPES)
export const HTTP_METHODS_SET = new Set<string>(HTTP_METHODS)
export const PAYMENT_NETWORKS_SET = new Set<string>(PAYMENT_NETWORKS)

export const DYNAMIC_PRICE = 'dynamic' as const

export const PRICING_MODELS: readonly PricingModel[] = [
  'fixed',
  'dynamic',
  'subscription',
  'cart',
  'free'
] as const

export const DELIVERY_MODES: readonly DeliveryMode[] = [
  'sync',
  'polling',
  'webhook'
] as const

export const PRICING_MODELS_SET = new Set<string>(PRICING_MODELS)
export const DELIVERY_MODES_SET = new Set<string>(DELIVERY_MODES)
export const DURATION_RE = /^\d+(m|h|d|y)$/

export const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
