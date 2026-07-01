import type { AvailabilityResult, RdapTier } from "@/types/domain"
import { ok, err, type Result } from "@/types/domain"
import type { ApiError } from "@/types/domain"
import { getCachedAvailability, setCachedAvailability } from "@/lib/domain/cache"

// ─── IANA Bootstrap ─────────────────────────────────────────────────────────
let ianaCache: Record<string, string> | null = null;
let ianaCacheTime: number = 0;

async function getIanaBootstrap(): Promise<Record<string, string>> {
  if (ianaCache && Date.now() - ianaCacheTime < 24 * 60 * 60 * 1000) {
    return ianaCache;
  }
  try {
    const res = await fetch("https://data.iana.org/rdap/dns.json", {
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json() as any;
    const mapping: Record<string, string> = {};
    if (data && data.services) {
      for (const service of data.services) {
        const tlds = service[0] as string[];
        const urls = service[1] as string[];
        const url = urls.find(u => u.startsWith("https://")) || urls[0];
        if (url) {
          for (const tld of tlds) {
            mapping[tld] = url;
          }
        }
      }
    }
    ianaCache = mapping;
    ianaCacheTime = Date.now();
    return mapping;
  } catch (err) {
    console.error("Failed to fetch IANA bootstrap", err);
    return ianaCache || {}; // fallback to old cache or empty
  }
}

async function getRdapUrlForDomain(domain: string): Promise<string> {
  const parts = domain.split(".");
  if (parts.length < 2) return `https://rdap.org/domain/${encodeURIComponent(domain)}`;
  const tld = parts[parts.length - 1].toLowerCase();
  
  const mapping = await getIanaBootstrap();
  const server = mapping[tld];
  if (server) {
    return `${server}domain/${encodeURIComponent(domain)}`;
  }
  // Fallback if not in IANA (should be rare)
  return `https://rdap.org/domain/${encodeURIComponent(domain)}`;
}


// ─── RDAP Tier Classification (PRD v2.0 §3.2) ────────────────────────────────

/**
 * Tier 1: Major gTLDs — Direct RDAP, high confidence, green/red UI.
 * Tier 2: Other gTLDs — RDAP via IANA bootstrap, "verified via registry".
 * Tier 3: ccTLDs with patchy RDAP/WHOIS — "Unverified — confirm on registry".
 */
const TIER1_TLDS = new Set([
  ".com", ".net", ".org", ".io", ".ai", ".co", ".dev", ".app",
])

const TIER3_CCTLDS = new Set([
  ".tk", ".ml", ".ga", ".cf", ".gq",   // Freenom (unreliable RDAP)
  ".cn", ".ru", ".br", ".in", ".ir",   // ccTLDs with restricted RDAP
  ".ly", ".bd", ".af", ".iq", ".sy",   // Limited RDAP support
])

export function getTldTier(tld: string): RdapTier {
  const normalized = tld.toLowerCase()
  if (TIER1_TLDS.has(normalized)) return "tier1"
  if (TIER3_CCTLDS.has(normalized)) return "tier3"
  // Two-letter TLDs not in Tier 1 or explicitly listed → Tier 3 (ccTLD)
  if (/^\.[a-z]{2}$/.test(normalized)) return "tier3"
  return "tier2"
}

// ─── Parked Domain Detection ──────────────────────────────────────────────────

/**
 * Known parking nameserver patterns — signals the domain is for resale.
 * We check RDAP nameserver records against this list.
 */
const PARKING_NS_PATTERNS = [
  "sedoparking.com",
  "parkingcrew.net",
  "domainsponsor.com",
  "bodis.com",
  "afternic.com",
  "sedo.com",
  "hugedomains.com",
  "parklogic.com",
  "cashparking.com",
  "parking.ztomy.com",
  "above.com",
]

interface RdapResponse {
  nameservers?: Array<{ ldhName?: string }>
  status?: string[]
  events?: Array<{ eventAction?: string; eventDate?: string }>
}

function detectParkedFromRdap(rdapData: RdapResponse): boolean {
  const nameservers = rdapData.nameservers ?? []
  for (const ns of nameservers) {
    const name = (ns.ldhName ?? "").toLowerCase()
    if (PARKING_NS_PATTERNS.some((pattern) => name.includes(pattern))) {
      return true
    }
  }
  return false
}

/**
 * Estimate resale price band for parked domains based on TLD and name length.
 * These are rough bands — clearly labeled as estimates in the UI.
 */
export function estimateParkedPrice(tld: string, baseName: string): string {
  const len = baseName.length
  const tldMultiplier: Record<string, number> = {
    ".com": 5, ".io": 3, ".ai": 4, ".net": 2, ".org": 1.5,
    ".co": 2.5, ".app": 2, ".dev": 2,
  }
  const mult = tldMultiplier[tld] ?? 1
  let base: number
  if (len <= 4) base = 5000
  else if (len <= 6) base = 2000
  else if (len <= 8) base = 800
  else base = 300
  const low = Math.round((base * mult) / 1000) * 1000
  const high = low * 3
  if (low >= 1000) {
    return `$${(low / 1000).toFixed(0)}k–$${(high / 1000).toFixed(0)}k`
  }
  return `$${low}–$${high}`
}

// ─── RDAP Check ───────────────────────────────────────────────────────────────

/**
 * Check domain availability via RDAP (free, no API key needed).
 * RDAP spec: 404 = available, 200 = registered.
 *
 * v2.0 additions:
 *  - Returns rdapTier per §3.2 accuracy tiering
 *  - Detects parked/for-sale domains from nameserver patterns
 *  - Tier 3 domains return "unverified" status, not silently unknown
 *
 * Cache-aside pattern:
 *   1. Check Supabase domain_cache (5 min TTL for available, 24 hr for taken)
 *   2. On cache miss → query RDAP
 *   3. Write result back to cache (non-fatal on failure)
 */
export async function checkDomainRDAP(
  domain: string,
  isPrimary: boolean = true,
  forceRefresh: boolean = false
): Promise<Result<AvailabilityResult>> {
  const tld = domain.includes(".") ? `.${domain.split(".").slice(1).join(".")}` : ""
  const tier = getTldTier(tld)

  // ── 1. Cache read ─────────────────────────────────────────────────────────
  if (!forceRefresh) {
    const cached = await getCachedAvailability(domain)
    if (cached) {
      return ok({ ...cached, rdapTier: tier })
    }
  }

  // ── 2. RDAP query ─────────────────────────────────────────────────────────
  const rdapUrl = await getRdapUrlForDomain(domain);

  let result: AvailabilityResult

  try {
    const res = await fetch(rdapUrl, {
      method: "GET",
      headers: { Accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (res.status === 404) {
      // RDAP 404 = domain not registered = available
      result = {
        available: true,
        status: "available" as const,
        rdapTier: tier,
        isParked: false,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    } else if (res.status === 200) {
      // Try to parse RDAP body to detect parking and expiry
      let isParked = false
      let expiresAt: string | undefined = undefined
      if (isPrimary) {
        try {
          const rdapData = await res.json() as RdapResponse
          isParked = detectParkedFromRdap(rdapData)
          
          const expEvent = rdapData.events?.find(e => e.eventAction === "expiration")
          if (expEvent?.eventDate) {
            expiresAt = expEvent.eventDate
          }
        } catch {
          // JSON parse failed — can't detect parking, but domain is still taken
        }
      }

      result = {
        available: false,
        status: isParked ? "parked" : "taken",
        rdapTier: tier,
        isParked,
        checkedAt: new Date().toISOString(),
        expiresAt,
        fromCache: false,
      }
    } else if (tier === "tier3") {
      // Tier 3 + ambiguous response = explicitly "unverified"
      result = {
        available: false,
        status: "unverified" as const,
        rdapTier: tier,
        isParked: false,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    } else {
      // Ambiguous status (e.g. 503, rate limit) — return unknown
      result = {
        available: false,
        status: "unknown" as const,
        rdapTier: tier,
        isParked: false,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      }
    }
  } catch (e) {
    // Network error or timeout
    const message = e instanceof Error ? e.message : "Unknown error"

    // For Tier 3 on network error, return unverified instead of error
    if (tier === "tier3") {
      return ok({
        available: false,
        status: "unverified" as const,
        rdapTier: tier,
        isParked: false,
        checkedAt: new Date().toISOString(),
        fromCache: false,
      })
    }

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
  domainContexts?: { domain: string, isPrimary: boolean, forceRefresh?: boolean }[]
): Promise<Map<string, AvailabilityResult>> {
  const results = new Map<string, AvailabilityResult>()
  
  const queue = domains.map(d => {
     if (domainContexts) {
       const ctx = domainContexts.find(c => c.domain === d)
       return { domain: d, isPrimary: ctx?.isPrimary ?? true, forceRefresh: ctx?.forceRefresh ?? false }
     }
     return { domain: d, isPrimary: true, forceRefresh: false }
  })

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency)
    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const result = await checkDomainRDAP(item.domain, item.isPrimary, item.forceRefresh)
        return { domain: item.domain, result }
      }),
    )

    for (const item of settled) {
      if (item.status === "fulfilled") {
        const { domain, result } = item.value
        const tld = domain.includes(".") ? `.${domain.split(".").slice(1).join(".")}` : ""
        if (result.ok) {
          results.set(domain, result.data)
        } else {
          results.set(domain, {
            available: false,
            status: getTldTier(tld) === "tier3" ? "unverified" : "unknown",
            rdapTier: getTldTier(tld),
            isParked: false,
            checkedAt: new Date().toISOString(),
            fromCache: false,
          })
        }
      }
    }
  }

  return results
}
