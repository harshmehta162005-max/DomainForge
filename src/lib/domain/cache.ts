import { getServiceClient } from "@/lib/supabase/service"
import type { AvailabilityResult, DomainSuggestion } from "@/types/domain"

// ─── TTL constants ────────────────────────────────────────────────────────────

const CACHE_TTL_AVAILABLE_MS = 5 * 60 * 1000        // 5 min — per CLAUDE.md
const CACHE_TTL_TAKEN_MS = 24 * 60 * 60 * 1000      // 24 hr — taken domains rarely flip
const CACHE_TTL_UNKNOWN_MS = 60 * 1000               // 1 min — unknown = retry sooner
const CACHE_TTL_GENERATION_MS = 60 * 60 * 1000       // 1 hr — per CLAUDE.md

// ─── Helper: safe service client ─────────────────────────────────────────────

function safeServiceClient() {
  try {
    return getServiceClient()
  } catch {
    return null
  }
}

// ─── Domain Availability Cache (table: domain_cache) ─────────────────────────

/**
 * Get cached RDAP availability result from Supabase.
 * Returns null on cache miss, expiry, or any DB error (non-fatal).
 */
export async function getCachedAvailability(
  domain: string,
): Promise<AvailabilityResult | null> {
  const db = safeServiceClient()
  if (!db) return null

  try {
    const { data, error } = await db
      .from("domain_cache")
      .select("available, status, checked_at, expires_at, rdap_tier, is_parked")
      .eq("domain", domain)
      .gt("expires_at", new Date().toISOString()) // only fresh rows
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
    // Never crash the calling code on cache failure
    return null
  }
}

/**
 * Write RDAP availability result to Supabase cache.
 * Non-fatal — silently ignores any DB errors.
 */
export async function setCachedAvailability(
  domain: string,
  result: AvailabilityResult,
): Promise<void> {
  const db = safeServiceClient()
  if (!db) return

  const ttl =
    result.status === "available"
      ? CACHE_TTL_AVAILABLE_MS
      : result.status === "taken" || result.status === "parked"
        ? CACHE_TTL_TAKEN_MS
        : CACHE_TTL_UNKNOWN_MS

  const expiresAt = new Date(Date.now() + ttl).toISOString()

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

// ─── Generation Cache (table: generation_cache) ───────────────────────────────

/**
 * Get cached generation suggestions by prompt hash.
 * Returns null on cache miss, expiry, or any DB error.
 */
export async function getCachedGeneration(
  cacheKey: string,
): Promise<DomainSuggestion[] | null> {
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
 * Write generation suggestions to Supabase cache (1-hour TTL).
 * Non-fatal — silently ignores any DB errors.
 */
export async function setCachedGeneration(
  cacheKey: string,
  suggestions: DomainSuggestion[],
): Promise<void> {
  const db = safeServiceClient()
  if (!db) return

  const expiresAt = new Date(Date.now() + CACHE_TTL_GENERATION_MS).toISOString()

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
