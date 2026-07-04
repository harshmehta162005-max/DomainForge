import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildSocialAnalysisPrompt, buildTrademarkAnalysisPrompt } from "@/lib/groq/prompt-builder"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import type { DomainAnalysis, DomainTldResult } from "@/types/domain"

// ─── Zod schema ───────────────────────────────────────────────────────────────

const AnalyzeRequestSchema = z.object({
  baseName: z.string().min(1).max(63),          // e.g. "brewly"
  currentTld: z.string().optional().default(".com"),  // skip from alt check
  businessDescription: z.string().min(2).max(500).optional().default("General business"),
  categories: z.array(z.string()).optional().default(["General"]),
})

// ─── Alternative TLDs to check ────────────────────────────────────────────────

const ALT_TLDS = [".com", ".io", ".ai", ".co", ".dev", ".net", ".app"]

// ─── Safely extract analysis JSON from LLM output ────────────────────────────

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

// ─── Route handler ────────────────────────────────────────────────────────────

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

  const parsed = AnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { baseName, currentTld, businessDescription, categories } = parsed.data

  // 2. Run Groq social analysis, trademark analysis + RDAP alt-TLD checks in parallel
  const [socialResult, trademarkResult, rdapResults] = await Promise.allSettled([
    // 2a. Groq social analysis
    (async () => {
      const groq = getGroqClient()
      const prompt = buildSocialAnalysisPrompt(baseName)
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.fast,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 512,
      })
      return completion.choices[0]?.message?.content ?? ""
    })(),

    // 2b. Groq trademark analysis (using quality model for better reasoning)
    (async () => {
      const groq = getGroqClient()
      const prompt = buildTrademarkAnalysisPrompt(baseName, businessDescription, categories)
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.quality,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
      })
      return completion.choices[0]?.message?.content ?? ""
    })(),

    // 2c. Alternative TLD RDAP checks (exclude the current TLD)
    checkDomainsAvailability(
      ALT_TLDS
        .filter((tld) => tld !== currentTld)
        .map((tld) => `${baseName}${tld}`),
      4,
    ),
  ])

  // 3. Parse outputs
  let socialSuggestions: string[] = []
  
  let trademarkRisk: DomainAnalysis["trademarkRisk"] = "medium"
  let trademarkScore = 50
  let trademarkSummary = "Unable to assess trademark risk."
  let trademarkKeyReasons = ["Analysis failed or timed out."]
  let trademarkRecommendedAction = "Manual verification required."
  let trademarkDisclaimer = "This is a preliminary AI assessment only and does not constitute legal advice."

  if (socialResult.status === "fulfilled") {
    const raw = parseJsonSafe<{ social_suggestions?: unknown }>(socialResult.value)
    if (raw && Array.isArray(raw.social_suggestions)) {
      socialSuggestions = (raw.social_suggestions as unknown[])
        .filter((s): s is string => typeof s === "string")
        .slice(0, 5)
    }
  }

  if (trademarkResult.status === "fulfilled") {
    const raw = parseJsonSafe<{
      riskLevel?: unknown
      riskScore?: unknown
      summary?: unknown
      keyReasons?: unknown
      recommendedAction?: unknown
      disclaimer?: unknown
    }>(trademarkResult.value)

    if (raw) {
      if (raw.riskLevel === "low" || raw.riskLevel === "medium" || raw.riskLevel === "high") {
        trademarkRisk = raw.riskLevel
      }
      if (typeof raw.riskScore === "number") trademarkScore = raw.riskScore
      if (typeof raw.summary === "string") trademarkSummary = raw.summary
      if (Array.isArray(raw.keyReasons)) {
        trademarkKeyReasons = raw.keyReasons.filter((r): r is string => typeof r === "string")
      }
      if (typeof raw.recommendedAction === "string") trademarkRecommendedAction = raw.recommendedAction
      if (typeof raw.disclaimer === "string") trademarkDisclaimer = raw.disclaimer
    }
  }

  // 4. Build alternative TLD results
  const altTlds: DomainTldResult[] = ALT_TLDS
    .filter((tld) => tld !== currentTld)
    .map((tld) => {
      const domain = `${baseName}${tld}`
      const rdapData =
        rdapResults.status === "fulfilled"
          ? rdapResults.value.get(domain)
          : undefined

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

  // 5. Return combined analysis
  const analysis: DomainAnalysis = {
    baseName,
    socialSuggestions,
    trademarkRisk,
    trademarkScore,
    trademarkSummary,
    trademarkKeyReasons,
    trademarkRecommendedAction,
    trademarkDisclaimer,
    altTlds,
  }

  return NextResponse.json(analysis)
}
