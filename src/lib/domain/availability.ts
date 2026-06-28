import type { AvailabilityResult } from "@/types/domain"
import { ok, err, type Result } from "@/types/domain"
import type { ApiError } from "@/types/domain"
import { getCachedAvailability, setCachedAvailability } from "@/lib/domain/cache"

/**
 * Check domain availability via RDAP (free, no API key needed).
 * RDAP spec: 404 = available, 200 = registered.
 *
 * Cache-aside pattern:
 *   1. Check Supabase domain_cache (5 min TTL for available, 24 hr for taken)
 *   2. On cache miss → query RDAP
 *   3. Write result back to cache (non-fatal on failure)
 */
export async function checkDomainRDAP(
  domain: string,
): Promise<Result<AvailabilityResult>> {
  // ── 1. Cache read ─────────────────────────────────────────────────────────
  const cached = await getCachedAvailability(domain)
  if (cached) {
    return ok(cached)
  }

  // ── 2. RDAP query ─────────────────────────────────────────────────────────
  const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`

  let result: AvailabilityResult

  try {
    const res = await fetch(rdapUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (res.status === 404) {
      // RDAP 404 = domain not registered = available
      result = {
        available: true,
        status: "available" as const,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    } else if (res.status === 200) {
      result = {
        available: false,
        status: "taken" as const,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    } else {
      // Ambiguous status (e.g. 503, rate limit) — return unknown
      result = {
        available: false,
        status: "unknown" as const,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    }
  } catch (e) {
    // Network error or timeout — return error, don't crash
    const message = e instanceof Error ? e.message : "Unknown error"
    return err<ApiError>({
      error: `RDAP check failed for ${domain}: ${message}`,
      code: "RDAP_ERROR",
    })
  }

  // ── 3. Cache write (non-fatal) ────────────────────────────────────────────
  // Fire-and-forget — do not await, do not let cache errors block the response
  setCachedAvailability(domain, result).catch(() => {
    // Intentionally swallowed — cache write failure is non-fatal
  })

  return ok(result)
}

/**
 * Batch availability check for multiple domains.
 * Runs in parallel with a concurrency limit.
 * Cache-aside is handled inside checkDomainRDAP per domain.
 */
export async function checkDomainsAvailability(
  domains: string[],
  concurrency = 5,
): Promise<Map<string, AvailabilityResult>> {
  const results = new Map<string, AvailabilityResult>()
  const queue = [...domains]

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency)
    const settled = await Promise.allSettled(
      batch.map(async (domain) => {
        const result = await checkDomainRDAP(domain)
        return { domain, result }
      }),
    )

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const { domain, result } = item.value
        if (result.ok) {
          results.set(domain, result.data)
        } else {
          results.set(domain, {
            available: false,
            status: "unknown",
            checkedAt: new Date().toISOString(),
            fromCache: false,
          })
        }
      }
    }
  }

  return results
}
