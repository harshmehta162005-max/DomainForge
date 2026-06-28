import Groq from "groq-sdk"
import { env } from "@/lib/env"

let _client: Groq | null = null

/**
 * Singleton Groq client — instantiated once per server process.
 */
export function getGroqClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: env.GROQ_API_KEY })
  }
  return _client
}

// Model constants — update here to change globally
export const GROQ_MODELS = {
  fast: "llama-3.1-8b-instant",       // Quick generation, lower cost
  quality: "llama-3.3-70b-versatile", // Higher quality, slower
} as const

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS]
