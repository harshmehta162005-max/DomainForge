import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildGenerationPrompt } from "@/lib/groq/prompt-builder"
import { captureError, captureWarn } from "@/lib/observability"
import { parseGenerationOutput } from "@/lib/groq/parser"
import { checkDomainsAvailability, getTldTier, estimateParkedPrice } from "@/lib/domain/availability"
import {
  computePromptCacheKey,
  getCachedGeneration,
  setCachedGeneration,
} from "@/lib/domain/cache"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import type { DomainSuggestion, ScoreBreakdown, TonePreset } from "@/types/domain"

// ─── Request Schema ───────────────────────────────────────────────────────────

const GenerateRequestSchema = z.object({
  businessDescription: z.string().min(2).max(500),
  categories: z.array(z.string()).optional().default(["General"]),
  targetAudience: z.string().optional().default("entrepreneurs and startups"),
  problemSolved: z.string().optional().default("building a new online presence"),
  tonePreset: z.enum(["playful", "corporate", "minimal", "bold", "technical"]).optional(),
  preferences: z
    .object({
      modern: z.number().min(0).max(100).optional(),
      cool: z.number().min(0).max(100).optional(),
      professional: z.number().min(0).max(100).optional(),
      short: z.number().min(0).max(100).optional(),
      memorable: z.number().min(0).max(100).optional(),
      brandable: z.number().min(0).max(100).optional(),
      length: z.enum(["short", "medium", "long"]).optional(),
    })
    .optional(),
  tlds: z.array(z.string()).optional().default([".com", ".io", ".ai"]),
  count: z.number().min(5).max(20).optional().default(8),
  maxLength: z.number().min(4).max(20).optional().default(13),
  excludeWords: z.array(z.string()).optional().default([]),
  namingStyles: z.array(z.string()).optional().default([]),
})

type GenerateRequest = z.infer<typeof GenerateRequestSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Price estimation ─────────────────────────────────────────────────────────

const TLD_BASE_PRICES: Record<string, number> = {
  ".com": 12, ".io": 39, ".ai": 89, ".co": 25, ".app": 18,
  ".dev": 12, ".net": 14, ".org": 12, ".sh": 28, ".tech": 9,
  ".xyz": 2,  ".gg": 22,  ".me": 9,   ".so": 29, ".run": 5,
}

function estimateDomainPrice(tld: string, domainName: string, score: number): string {
  const base = TLD_BASE_PRICES[tld] ?? 15
  const lengthMult = domainName.length <= 5 ? 1.8 : domainName.length <= 7 ? 1.2 : 1.0
  const scoreMult  = score >= 85 ? 1.5 : score >= 70 ? 1.1 : 1.0
  const price = Math.round(base * lengthMult * scoreMult)
  return `$${price}/yr`
}

/** Convert a raw base name + TLD into a full DomainSuggestion */
function buildSuggestion(
  baseName: string,
  tld: string,
  rationale: string,
  style: DomainSuggestion["style"],
  score: number,
  scoreBreakdown: ScoreBreakdown | null,
  availResult: { available: boolean; status: DomainSuggestion["availabilityStatus"]; rdapTier: "tier1"|"tier2"|"tier3"; isParked: boolean }
): DomainSuggestion {
  const domain = `${baseName}${tld}`
  return {
    domain,
    baseName,
    tld,
    available: availResult.available,
    availabilityStatus: availResult.status,
    rdapTier: availResult.rdapTier,
    isParked: availResult.isParked,
    parkedPriceEstimate: availResult.isParked ? estimateParkedPrice(tld, baseName) : null,
    score,
    scoreBreakdown,
    explanation: rationale,
    style,
    priceEstimate: estimateDomainPrice(tld, baseName, score),
    registrarLinks: {
      namecheap: namecheapUrl(domain),
      godaddy: godaddyUrl(domain),
    },
    socialHandles: null, // Will be fetched later on demand
  }
}

/**
 * Normalize a GenerateRequest into a stable JSON string for cache key hashing.
 * Uses sorted keys so {"a":1,"b":2} and {"b":2,"a":1} produce the same hash.
 */
function normalizeForCacheKey(req: GenerateRequest): string {
  return JSON.stringify({
    businessDescription: req.businessDescription.trim().toLowerCase(),
    categories: [...req.categories].sort(),
    targetAudience: req.targetAudience,
    problemSolved: req.problemSolved,
    tonePreset: req.tonePreset,
    tlds: [...req.tlds].sort(),
    count: req.count,
  })
}

async function callGroqAndParse(req: GenerateRequest, countOverride?: number) {
  const prefs = req.preferences ?? {}
  const count = countOverride ?? req.count
  const prompt = buildGenerationPrompt({
    businessDescription: req.businessDescription,
    categories: req.categories,
    targetAudience: req.targetAudience,
    problemSolved: req.problemSolved,
    preferences: {
      modern: prefs.modern ?? 70,
      cool: prefs.cool ?? 60,
      professional: prefs.professional ?? 65,
      short: prefs.short ?? 70,
      memorable: prefs.memorable ?? 80,
      brandable: prefs.brandable ?? 75,
      length: prefs.length ?? "short",
    },
    tlds: req.tlds,
    count,
    maxLength: req.maxLength,
    excludeWords: req.excludeWords,
    namingStyles: req.namingStyles,
  }, req.tonePreset)

  const groq = getGroqClient()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.quality,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }, { signal: controller.signal })
    
    const rawOutput = completion.choices[0]?.message?.content ?? ""
    return parseGenerationOutput(rawOutput)
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "INVALID_INPUT",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const req: GenerateRequest = parsed.data

  const cacheKeyInput = normalizeForCacheKey(req)
  const cacheKey = await computePromptCacheKey(cacheKeyInput)

  const cachedSuggestions = await getCachedGeneration(cacheKey)
  if (cachedSuggestions && cachedSuggestions.length > 0) {
    return NextResponse.json({
      suggestions: cachedSuggestions,
      metadata: {
        totalGenerated: cachedSuggestions.length,
        cached: cachedSuggestions.length,
        sessionId: crypto.randomUUID(),
      },
    })
  }

  const parseResult = await callGroqAndParse(req).catch(e => {
    const isTimeout = e instanceof Error && (e.name === "AbortError" || e.message?.includes("aborted"))
    if (isTimeout) {
      console.error("[LLM_TIMEOUT] Groq LLM did not respond within 15s", { desc: req.businessDescription })
      captureError(e, { component: "LLM_Generation", reason: "timeout" })
      return { ok: false, error: { error: "AI generation timed out. Please try again.", code: "LLM_TIMEOUT" } } as const
    }
    console.error("[LLM_ERROR]", e instanceof Error ? e.message : String(e))
    captureError(e, { component: "LLM_Generation" })
    return { ok: false, error: { error: e instanceof Error ? e.message : "Generation failed", code: "LLM_ERROR" } } as const
  })
  if (!parseResult.ok) {
    return NextResponse.json(
      { error: parseResult.error.error, code: parseResult.error.code },
      { status: 502 },
    )
  }

  const rawSuggestions = parseResult.data

  const primaryTld = req.tlds[0] ?? ".com"
  const primaryDomains = rawSuggestions.map((s) => `${s.name}${primaryTld}`)

  let availabilityMap = new Map<string, any>()
  try {
    const results = await checkDomainsAvailability(primaryDomains, 5)
    availabilityMap = results
  } catch (err) {
    captureWarn("RDAP Bulk Check Failed", { error: err, domains: primaryDomains })
  }

  let suggestions: DomainSuggestion[] = []
  
  let availableCount = 0
  for (const domain of primaryDomains) {
    if (availabilityMap.get(domain)?.available) availableCount++
  }

  // Backfill if < 3 available
  let fallbackTriggered = false
  if (availableCount < 3 && req.count > 3) {
    console.log("[generate] Only", availableCount, "available. Backfilling with more variations.")
    const backfillResult = await callGroqAndParse(req, 10).catch(() => null)
    if (backfillResult && backfillResult.ok) {
      fallbackTriggered = true
      const newDomains = backfillResult.data.map(s => `${s.name}${primaryTld}`)
      const newAvail = await checkDomainsAvailability(newDomains, 5).catch(() => new Map())
      for (const [k, v] of newAvail.entries()) availabilityMap.set(k, v)
      rawSuggestions.push(...backfillResult.data)
    }
  }

  // Deduplicate base names
  const seenBase = new Set<string>()
  const finalRaw = rawSuggestions.filter(s => {
    if (seenBase.has(s.name.toLowerCase())) return false
    seenBase.add(s.name.toLowerCase())
    return true
  }).slice(0, req.count * 2)

  for (const raw of finalRaw) {
    const primaryDomain = `${raw.name}${primaryTld}`
    const primaryAvail = availabilityMap.get(primaryDomain)

    suggestions.push(
      buildSuggestion(
        raw.name,
        primaryTld,
        raw.rationale,
        raw.style,
        raw.pre_score,
        raw.score_breakdown,
        {
          available: primaryAvail?.available ?? false,
          status: primaryAvail?.status ?? "unknown",
          rdapTier: primaryAvail?.rdapTier ?? getTldTier(primaryTld),
          isParked: primaryAvail?.isParked ?? false,
        }
      ),
    )

    // Secondary TLDs
    for (const tld of req.tlds.slice(1)) {
      const domain = `${raw.name}${tld}`
      suggestions.push(
        buildSuggestion(
          raw.name,
          tld,
          raw.rationale,
          raw.style,
          Math.max(0, raw.pre_score - 5),
          raw.score_breakdown ? { ...raw.score_breakdown, tldTrust: Math.max(0, raw.score_breakdown.tldTrust - 10) } : null,
          { available: false, status: getTldTier(tld) === "tier3" ? "unverified" : "unknown", rdapTier: getTldTier(tld), isParked: false }
        )
      )
    }
  }

  suggestions.sort((a, b) => {
    if (a.availabilityStatus === "available" && b.availabilityStatus !== "available") return -1
    if (b.availabilityStatus === "available" && a.availabilityStatus !== "available") return 1
    return b.score - a.score
  })

  // Take top N (if backfilled we might have too many)
  suggestions = suggestions.slice(0, req.count * req.tlds.length)

  setCachedGeneration(cacheKey, suggestions).catch(() => {})

  return NextResponse.json({
    suggestions,
    metadata: {
      totalGenerated: suggestions.length,
      cached: 0,
      sessionId: crypto.randomUUID(),
      fallbackTriggered,
    },
  })
}
