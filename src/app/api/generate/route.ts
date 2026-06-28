import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildGenerationPrompt } from "@/lib/groq/prompt-builder"
import { parseGenerationOutput } from "@/lib/groq/parser"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import {
  computePromptCacheKey,
  getCachedGeneration,
  setCachedGeneration,
} from "@/lib/domain/cache"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import type { DomainSuggestion } from "@/types/domain"

// ─── Request Schema (lenient for Phase 1 — only description required) ─────────

const GenerateRequestSchema = z.object({
  businessDescription: z.string().min(2).max(500),
  categories: z.array(z.string()).optional().default(["General"]),
  targetAudience: z.string().optional().default("entrepreneurs and startups"),
  problemSolved: z.string().optional().default("building a new online presence"),
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
  // Short, high-scoring domains cost more (premium market)
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
  available: boolean,
): DomainSuggestion {
  const domain = `${baseName}${tld}`
  return {
    domain,
    baseName,
    tld,
    available,
    availabilityStatus: available ? "available" : "taken",
    score,
    explanation: rationale,
    style,
    priceEstimate: estimateDomainPrice(tld, baseName, score),
    registrarLinks: {
      namecheap: namecheapUrl(domain),
      godaddy: godaddyUrl(domain),
    },
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
    tlds: [...req.tlds].sort(),
    count: req.count,
    // Preferences intentionally omitted from cache key — minor slider tweaks
    // should still benefit from cache. Change this if suggestions feel wrong.
  })
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Validate input
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

  // 2. Compute prompt cache key and check generation cache (1-hour TTL)
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

  // 3. Build prompt and call Groq
  const prefs = req.preferences ?? {}
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
    count: req.count,
  })

  let rawOutput: string
  try {
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.quality, // 70b model has better JSON compliance than 8b
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    })
    rawOutput = completion.choices[0]?.message?.content ?? ""
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `LLM generation failed: ${message}`, code: "LLM_ERROR" },
      { status: 502 },
    )
  }

  // 4. Parse LLM output
  const parseResult = parseGenerationOutput(rawOutput)
  if (!parseResult.ok) {
    return NextResponse.json(
      { error: parseResult.error.error, code: parseResult.error.code },
      { status: 502 },
    )
  }

  const rawSuggestions = parseResult.data

  // 5. Build domain list — primary TLD only for Phase 1 speed
  // Each base name gets the first preferred TLD for RDAP check.
  // Additional TLDs are returned as "unknown" (client can check separately).
  const primaryTld = req.tlds[0] ?? ".com"
  const primaryDomains = rawSuggestions.map((s) => `${s.name}${primaryTld}`)

  // 6. Check RDAP availability (batched, concurrency 5) — cache-aside handled inside
  let availabilityMap: Map<string, { available: boolean; status: string }>
  try {
    const results = await checkDomainsAvailability(primaryDomains, 5)
    availabilityMap = new Map(
      Array.from(results.entries()).map(([domain, r]) => [
        domain,
        { available: r.available, status: r.status },
      ]),
    )
  } catch {
    // Non-fatal — return suggestions with unknown availability
    availabilityMap = new Map()
  }

  // 7. Build final suggestions array
  const suggestions: DomainSuggestion[] = []

  for (const raw of rawSuggestions) {
    // Primary TLD — has real availability data
    const primaryDomain = `${raw.name}${primaryTld}`
    const primaryAvail = availabilityMap.get(primaryDomain)

    suggestions.push(
      buildSuggestion(
        raw.name,
        primaryTld,
        raw.rationale,
        raw.style,
        raw.pre_score,
        primaryAvail?.available ?? false,
      ),
    )

    // Additional TLDs — returned as "unknown" (Phase 1)
    for (const tld of req.tlds.slice(1)) {
      const domain = `${raw.name}${tld}`
      suggestions.push({
        domain,
        baseName: raw.name,
        tld,
        available: false,
        availabilityStatus: "unknown",
        score: Math.max(0, raw.pre_score - 5), // slight score reduction for non-primary TLDs
        explanation: raw.rationale,
        style: raw.style,
        priceEstimate: estimateDomainPrice(tld, raw.name, raw.pre_score - 5),
        registrarLinks: {
          namecheap: namecheapUrl(domain),
          godaddy: godaddyUrl(domain),
        },
      })
    }
  }

  // Sort: available first, then by score descending
  suggestions.sort((a, b) => {
    if (a.availabilityStatus === "available" && b.availabilityStatus !== "available") return -1
    if (b.availabilityStatus === "available" && a.availabilityStatus !== "available") return 1
    return b.score - a.score
  })

  // 8. Write to generation cache (fire-and-forget, 1-hour TTL)
  setCachedGeneration(cacheKey, suggestions).catch(() => {
    // Intentionally swallowed — cache write failure is non-fatal
  })

  return NextResponse.json({
    suggestions,
    metadata: {
      totalGenerated: suggestions.length,
      cached: 0,
      sessionId: crypto.randomUUID(),
    },
  })
}
