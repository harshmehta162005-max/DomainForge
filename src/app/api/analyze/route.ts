import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildSocialAnalysisPrompt, buildTrademarkAnalysisPrompt } from "@/lib/groq/prompt-builder"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import { getServiceClient } from "@/lib/supabase/service"
import { searchUSPTOTrademarks, computeUsptoConflictBonus } from "@/lib/trademark/markerapi"
import { env } from "@/lib/env"
import type { DomainAnalysis, DomainTldResult } from "@/types/domain"

// ─── Zod schema ───────────────────────────────────────────────────────────────

const AnalyzeRequestSchema = z.object({
  baseName: z.string().min(1).max(63),
  currentTld: z.string().optional().default(".com"),
  businessDescription: z.string().min(2).max(500).optional().default("General business"),
  categories: z.array(z.string()).optional().default(["General"]),
})

// ─── Alternative TLDs to check ────────────────────────────────────────────────

const ALT_TLDS = [".com", ".io", ".ai", ".co", ".dev", ".net", ".app"]

// ─── Cache TTL: 24 hours for analysis results ─────────────────────────────────

const ANALYSIS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ─── Safely extract JSON from LLM output ─────────────────────────────────────

function parseJsonSafe<T>(raw: string): T | null {
  const stripped = raw
    .split("\n")
    .filter((l) => !l.trim().startsWith("```"))
    .join("\n")
    .trim()

  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end === -1) return null

  try {
    return JSON.parse(stripped.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────

function makeAnalysisCacheKey(baseName: string, categories: string[]): string {
  return `analyze_v5_${baseName.toLowerCase()}_${[...categories].sort().join("_")}`
}

async function getCachedAnalysis(cacheKey: string): Promise<DomainAnalysis | null> {
  try {
    const db = getServiceClient()
    const { data } = await db
      .from("generation_cache")
      .select("suggestions")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (!data) return null
    return (data as unknown as { suggestions: DomainAnalysis }).suggestions
  } catch {
    return null
  }
}

async function setCachedAnalysis(cacheKey: string, analysis: DomainAnalysis): Promise<void> {
  try {
    const db = getServiceClient()
    const expiresAt = new Date(Date.now() + ANALYSIS_CACHE_TTL_MS).toISOString()
    await (db.from("generation_cache") as any).upsert(
      { cache_key: cacheKey, suggestions: analysis as any, expires_at: expiresAt },
      { onConflict: "cache_key" },
    )
  } catch {
    // Non-fatal
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "PARSE_ERROR" }, { status: 400 })
  }

  const parsed = AnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { baseName, currentTld, businessDescription, categories } = parsed.data

  // Check cache first
  const cacheKey = makeAnalysisCacheKey(baseName, categories)
  const cached = await getCachedAnalysis(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // Whether MarkerAPI is configured
  const markerEnabled = !!(env.MARKERAPI_USERNAME && env.MARKERAPI_PASSWORD)

  // Run everything in parallel: Groq social, Groq trademark, RDAP alt-TLDs, MarkerAPI USPTO
  const [socialResult, trademarkResult, rdapResults, usptoResult] = await Promise.allSettled([
    // Groq social handle suggestions (staggered 300ms to avoid simultaneous rate limits)
    (async () => {
      await new Promise(r => setTimeout(r, 300))
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.fast,
        messages: [
          {
            role: "system",
            content: "You are a social media branding expert. Always respond with valid JSON only. No markdown, no prose.",
          },
          { role: "user", content: buildSocialAnalysisPrompt(baseName) },
        ],
        temperature: 0.3,
        max_tokens: 512,
      })
      return completion.choices[0]?.message?.content ?? ""
    })(),

    // Groq trademark risk assessment
    (async () => {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.quality,
        messages: [
          {
            role: "system",
            content: "You are a trademark risk analyst. Always respond with valid JSON only. No markdown, no prose.",
          },
          { role: "user", content: buildTrademarkAnalysisPrompt(baseName, businessDescription, categories) },
        ],
        temperature: 0.15,
        max_tokens: 1536,
      })
      return completion.choices[0]?.message?.content ?? ""
    })(),

    // RDAP: alt TLD availability checks
    checkDomainsAvailability(
      ALT_TLDS.filter((tld) => tld !== currentTld).map((tld) => `${baseName}${tld}`),
      4,
    ),

    // MarkerAPI: real USPTO trademark lookup (if credentials set)
    markerEnabled
      ? searchUSPTOTrademarks(baseName, env.MARKERAPI_USERNAME!, env.MARKERAPI_PASSWORD!)
      : Promise.resolve({ count: 0, trademarks: [] }),
  ])

  // Parse social suggestions
  let socialSuggestions: string[] = []
  if (socialResult.status === "fulfilled") {
    const raw = parseJsonSafe<{ social_suggestions?: unknown }>(socialResult.value)
    if (raw && Array.isArray(raw.social_suggestions)) {
      socialSuggestions = (raw.social_suggestions as unknown[])
        .filter((s): s is string => typeof s === "string")
        .slice(0, 5)
    }
  } else {
    console.error("[analyze] socialResult rejected:", socialResult.reason)
  }

  // Parse Groq trademark result
  let trademarkRisk: DomainAnalysis["trademarkRisk"] = "medium"
  let trademarkScore = 50
  let trademarkConfidence: DomainAnalysis["trademarkConfidence"] = "medium"
  let trademarkSummary = "Unable to complete trademark assessment."
  let trademarkKeyReasons = ["Analysis failed or timed out — please try re-analyzing."]
  let trademarkRecommendedAction = "Manual verification recommended. Try the free USPTO TESS search."
  let trademarkDisclaimer = "This is a preliminary AI-based estimate. It does not constitute legal advice and does not replace a professional trademark clearance search."
  let trademarkUsptoDatabaseNote = "Unable to assess USPTO registry resemblance at this time."

  if (trademarkResult.status === "fulfilled") {
    const raw = parseJsonSafe<{
      riskLevel?: unknown
      riskScore?: unknown
      confidence?: unknown
      summary?: unknown
      keyReasons?: unknown
      recommendedAction?: unknown
      disclaimer?: unknown
      usptoDatabaseNote?: unknown
    }>(trademarkResult.value)

    if (raw) {
      if (raw.riskLevel === "low" || raw.riskLevel === "medium" || raw.riskLevel === "high") {
        trademarkRisk = raw.riskLevel
      }
      if (typeof raw.riskScore === "number") trademarkScore = Math.min(100, Math.max(0, raw.riskScore))
      if (raw.confidence === "low" || raw.confidence === "medium" || raw.confidence === "high") {
        trademarkConfidence = raw.confidence
      }
      if (typeof raw.summary === "string") trademarkSummary = raw.summary
      if (Array.isArray(raw.keyReasons)) {
        trademarkKeyReasons = raw.keyReasons.filter((r): r is string => typeof r === "string").slice(0, 4)
      }
      if (typeof raw.recommendedAction === "string") trademarkRecommendedAction = raw.recommendedAction
      if (typeof raw.disclaimer === "string") trademarkDisclaimer = raw.disclaimer
      if (typeof raw.usptoDatabaseNote === "string") trademarkUsptoDatabaseNote = raw.usptoDatabaseNote
    }
  }

  // Process USPTO real hits from MarkerAPI
  const usptoData = usptoResult.status === "fulfilled" ? usptoResult.value : { count: 0, trademarks: [] }
  const usptoHits = usptoData.trademarks.map(tm => ({
    serialnumber: tm.serialnumber,
    wordmark: tm.wordmark,
    status: tm.status,
    description: tm.description,
    code: tm.code,
    registrationdate: tm.registrationdate,
    owner: tm.owner,
  }))

  // Boost the AI risk score with real USPTO conflict data (capped at 100)
  if (markerEnabled && usptoHits.length > 0) {
    const bonus = computeUsptoConflictBonus(baseName, usptoData.trademarks)
    trademarkScore = Math.min(100, trademarkScore + bonus)

    // Upgrade risk level if score crossed a threshold after bonus
    if (trademarkScore >= 61 && trademarkRisk === "low") trademarkRisk = "medium"
    if (trademarkScore >= 75 && trademarkRisk !== "high") trademarkRisk = "high"

    // Upgrade confidence since we have real data backing the assessment
    if (trademarkConfidence === "low") trademarkConfidence = "medium"
  }

  // Build alternative TLD results
  const altTlds: DomainTldResult[] = ALT_TLDS
    .filter((tld) => tld !== currentTld)
    .map((tld) => {
      const domain = `${baseName}${tld}`
      const rdapData = rdapResults.status === "fulfilled" ? rdapResults.value.get(domain) : undefined
      return {
        domain,
        tld,
        status: rdapData?.status ?? "unknown",
        available: rdapData?.available ?? false,
        registrarLinks: {
          namecheap: namecheapUrl(domain),
          godaddy: godaddyUrl(domain),
        },
      } satisfies DomainTldResult & { registrarLinks: { namecheap: string; godaddy: string } }
    })

  // Assemble final analysis object
  const analysis: DomainAnalysis = {
    baseName,
    socialSuggestions,
    trademarkRisk,
    trademarkScore,
    trademarkConfidence,
    trademarkSummary,
    trademarkKeyReasons,
    trademarkRecommendedAction,
    trademarkDisclaimer,
    trademarkUsptoDatabaseNote,
    usptoSearched: markerEnabled,
    usptoHits,
    altTlds,
  }

  // Cache in background — don't await to avoid adding latency
  setCachedAnalysis(cacheKey, analysis)

  return NextResponse.json(analysis)
}
