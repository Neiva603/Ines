import Anthropic from '@anthropic-ai/sdk'

/**
 * Singleton Anthropic client.
 * Used exclusively in server-side code (API routes, Server Actions).
 * Never import this in client components — the API key would be exposed.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6' as const

/** Default generation parameters for quote generation */
export const QUOTE_GENERATION_CONFIG = {
  model: CLAUDE_MODEL,
  max_tokens: 2048,
  temperature: 0.3, // Lower temperature = more consistent, structured output
} as const
