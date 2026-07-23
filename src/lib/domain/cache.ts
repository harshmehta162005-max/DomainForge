import { getServiceClient } from "@/lib/supabase/service"
import { redis } from "@/lib/redis"
import type { AvailabilityResult, DomainSuggestion } from "@/types/domain"

// ─── TTL constants ────────────────────────────────────────────────────────────

const CACHE_TTL_AVAILABLE_S  = 5 * 60              // 5 min   — available domains
const CACHE_TTL_TAKEN_S      = 24 * 60 * 60        // 24 hr   — taken domains rarely flip
const CACHE_TTL_UNKNOWN_S    = 60                   // 1 min   — unknown = retry sooner
const CACHE_TTL_GENERATION_S = 60 * 60             // 1 hr    — AI generation cache

// ─── Helper: safe Supabase service client ─────────────────────────────────────

function safeServiceClient() {
  try {
    return getServiceClient()
  } catch {
    return null
  }
}

// ─── Domain Availability Cache ────────────────────────────────────────────────

/**
 * Get cached RDAP availability result.
 * Strategy: Redis first (fast) → Supabase fallback (reliable) → null (cache miss).
 */
export async function getCachedAvailability(
  domain: string,
): Promise<AvailabilityResult | null> {
  // ── 1. Try Redis ──────────────────────────────────────────────────────────
  if (redis) {
    try {
      const cached = await redis.get<AvailabilityResult>(`avail:${domain}`)
      if (cached) {
        return { ...cached, fromCache: true }
      }
    } catch (e) {
      console.warn("[Redis] getCachedAvailability failed — falling back to Supabase:", e)
    }
  }

  // ── 2. Fallback: Supabase domain_cache ────────────────────────────────────
  const db = safeServiceClient()
  if (!db) return null

  try {
    const { data, error } = await db
      .from("domain_cache")
      .select("available, status, checked_at, expires_at, rdap_tier, is_parked")
      .eq("domain", domain)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (error || !data) return null

    const row = data as unknown as {
      available: boolean
      status: string
      checked_at: string
      rdap_tier: string
      is_parked: boolean
    }

    return {
      available: row.available,
      status: row.status as AvailabilityResult["status"],
      checkedAt: row.checked_at,
      fromCache: true,
      rdapTier: (row.rdap_tier as AvailabilityResult["rdapTier"]) ?? "tier1",
      isParked: row.is_parked ?? false,
    }
  } catch {
    return null
  }
}

/**
 * Write RDAP availability result to cache.
 * Writes to Redis (if available) AND Supabase in parallel. Non-fatal.
 */
export async function setCachedAvailability(
  domain: string,
  result: AvailabilityResult,
): Promise<void> {
  const ttlSeconds =
    result.status === "available"
      ? CACHE_TTL_AVAILABLE_S
      : result.status === "taken" || result.status === "parked"
        ? CACHE_TTL_TAKEN_S
        : CACHE_TTL_UNKNOWN_S

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

  // ── 1. Write to Redis ─────────────────────────────────────────────────────
  if (redis) {
    try {
      await redis.set(`avail:${domain}`, result, { ex: ttlSeconds })
    } catch (e) {
      console.warn("[Redis] setCachedAvailability write failed:", e)
    }
  }

  // ── 2. Write to Supabase (always, as durable backup) ──────────────────────
  const db = safeServiceClient()
  if (!db) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("domain_cache") as any).upsert(
      {
        domain,
        available: result.available,
        status: result.status,
        checked_at: result.checkedAt,
        expires_at: expiresAt,
        from_cache: false,
        rdap_tier: result.rdapTier,
        is_parked: result.isParked,
      },
      { onConflict: "domain" },
    )
  } catch {
    // Non-fatal
  }
}

// ─── Generation Cache ─────────────────────────────────────────────────────────

/**
 * Get cached AI generation suggestions.
 * Strategy: Redis first → Supabase fallback → null.
 */
export async function getCachedGeneration(
  cacheKey: string,
): Promise<DomainSuggestion[] | null> {
  // ── 1. Try Redis ──────────────────────────────────────────────────────────
  if (redis) {
    try {
      const cached = await redis.get<DomainSuggestion[]>(`gen:${cacheKey}`)
      if (cached) return cached
    } catch (e) {
      console.warn("[Redis] getCachedGeneration failed — falling back to Supabase:", e)
    }
  }

  // ── 2. Fallback: Supabase generation_cache ────────────────────────────────
  const db = safeServiceClient()
  if (!db) return null

  try {
    const { data, error } = await db
      .from("generation_cache")
      .select("suggestions")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (error || !data) return null

    const row = data as unknown as { suggestions: DomainSuggestion[] }
    return row.suggestions
  } catch {
    return null
  }
}

/**
 * Write AI generation suggestions to cache.
 * Writes to Redis (if available) AND Supabase in parallel. Non-fatal.
 */
export async function setCachedGeneration(
  cacheKey: string,
  suggestions: DomainSuggestion[],
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_GENERATION_S * 1000).toISOString()

  // ── 1. Write to Redis ─────────────────────────────────────────────────────
  if (redis) {
    try {
      await redis.set(`gen:${cacheKey}`, suggestions, { ex: CACHE_TTL_GENERATION_S })
    } catch (e) {
      console.warn("[Redis] setCachedGeneration write failed:", e)
    }
  }

  // ── 2. Write to Supabase ──────────────────────────────────────────────────
  const db = safeServiceClient()
  if (!db) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from("generation_cache") as any).upsert(
      {
        cache_key: cacheKey,
        suggestions: suggestions,
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" },
    )
  } catch {
    // Non-fatal
  }
}

// ─── Cache key helper ─────────────────────────────────────────────────────────

/**
 * Compute a stable SHA-256 cache key from a JSON-serializable object.
 * Works in Edge + Node runtime (uses Web Crypto API).
 */
export async function computePromptCacheKey(promptJson: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(promptJson)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return "gen_" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
