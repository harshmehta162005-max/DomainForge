/**
 * ─── Redis Client ─────────────────────────────────────────────────────────────
 *
 * Provides a shared Upstash Redis client.
 * If UPSTASH_REDIS_REST_URL / TOKEN are not set, `redis` will be null
 * and all callers must fall back gracefully to Supabase or in-memory cache.
 */

import { Redis } from "@upstash/redis"
import { env } from "@/lib/env"

function createRedisClient(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  try {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    console.warn("[Redis] Failed to initialize Upstash Redis client — falling back to Supabase cache.")
    return null
  }
}

// Singleton — reused across requests in the same serverless instance
export const redis: Redis | null = createRedisClient()

export const REDIS_AVAILABLE = redis !== null
