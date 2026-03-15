import type {
  SkillManifest,
  A2AAgentCard,
  A2AAuthScheme,
  A2ATransport,
  A2ASkill
} from './types'

export interface ToAgentCardOptions {
  url?: string
  providerName?: string
  providerUrl?: string
  authSchemes?: A2AAuthScheme[]
  preferredTransport?: A2ATransport
  streaming?: boolean
  pushNotifications?: boolean
  documentationUrl?: string
}

/**
 * Convert a SkillManifest into an A2A Agent Card (v0.3.0).
 * Each endpoint becomes one A2ASkill.
 */
export function toAgentCard(
  manifest: SkillManifest,
  options?: ToAgentCardOptions
): A2AAgentCard {
  const humanReadableId = manifest.author
    ? `${manifest.author}/${manifest.name}`
    : manifest.name

  const skills: A2ASkill[] = manifest.endpoints.length > 0
    ? manifest.endpoints.map(ep => {
        const slug = ep.path
          .replace(/^\//, '')
          .replace(/\//g, '_')
          .replace(/[^a-zA-Z0-9_-]/g, '')

        const skill: A2ASkill = {
          id: `${manifest.name}_${slug}`,
          name: ep.description,
          description: `${ep.method} ${ep.path} — ${ep.priceUsdc} USDC`
        }

        if (manifest.tags?.length) {
          skill.tags = manifest.tags
        }

        if (ep.inputSchema) {
          skill.inputModes = ['application/json']
        }

        if (ep.outputSchema) {
          skill.outputModes = ['application/json']
        }

        return skill
      })
    : [{
        id: manifest.name,
        name: manifest.displayName ?? manifest.name,
        description: manifest.description
      }]

  const card: A2AAgentCard = {
    schemaVersion: '1.0',
    humanReadableId,
    agentVersion: manifest.version ?? '1.0.0',
    name: manifest.displayName ?? manifest.name,
    description: manifest.description,
    url: options?.url ?? manifest.base_url,
    protocolVersion: '0.3.0',
    preferredTransport: options?.preferredTransport ?? 'REST',
    provider: {
      name: options?.providerName ?? manifest.author ?? manifest.name,
      ...(options?.providerUrl ? { url: options.providerUrl } : {})
    },
    capabilities: {
      a2aVersion: '0.3.0',
      ...(options?.streaming !== undefined
        ? { streaming: options.streaming }
        : {}),
      ...(options?.pushNotifications !== undefined
        ? { pushNotifications: options.pushNotifications }
        : {})
    },
    authSchemes: options?.authSchemes ?? [{ scheme: 'x402' }]
  }

  if (skills.length > 0) {
    card.skills = skills
  }

  if (options?.documentationUrl) {
    card.documentationUrl = options.documentationUrl
  }

  return card
}
