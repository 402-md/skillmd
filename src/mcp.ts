import type { SkillManifest } from './types'
import { DYNAMIC_PRICE } from './constants'

/**
 * MCP tool definition shape.
 * Defined inline to avoid depending on @modelcontextprotocol/sdk.
 */
export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/**
 * Convert a SkillManifest into MCP tool definitions.
 * Each endpoint becomes one tool.
 */
export function toMcpToolDefinitions(
  manifest: SkillManifest
): McpToolDefinition[] {
  if (manifest.endpoints.length === 0) {
    return [
      {
        name: manifest.name,
        description: manifest.description,
        inputSchema: { type: 'object', properties: {} }
      }
    ]
  }

  return manifest.endpoints.map(ep => {
    const slug = ep.path
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')

    const network = manifest.payment.networks[0]?.network ?? 'unknown'

    const priceLabel =
      ep.priceUsdc === DYNAMIC_PRICE
        ? `dynamic pricing${ep.estimatedPriceUsdc ? `, ~${ep.estimatedPriceUsdc} USDC est.` : ''} via ${network}`
        : `${ep.priceUsdc} USDC via ${network}`

    return {
      name: `${manifest.name}_${slug}`,
      description: `${ep.description} (${priceLabel})`,
      inputSchema: ep.inputSchema ?? { type: 'object', properties: {} }
    }
  })
}
