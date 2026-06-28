import { NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildSocialAnalysisPrompt } from "@/lib/groq/prompt-builder"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import type { DomainAnalysis, DomainTldResult } from "@/types/domain"

// ─── Zod schema ───────────────────────────────────────────────────────────────

const AnalyzeRequestSchema = z.object({
  baseName: z.string().min(1).max(63),          // e.g. "brewly"
  currentTld: z.string().optional().default(".com"),  // skip from alt check
})

// ─── Alternative TLDs to check ────────────────────────────────────────────────

const ALT_TLDS = [".com", ".io", ".ai", ".co", ".dev", ".net", ".app"]

// ─── Safely extract analysis JSON from LLM output ────────────────────────────

function parseAnalysisJson(raw: string): {
  social_suggestions?: unknown
  trademark_risk?: unknown
  reason?: unknown
} {
  // Strip markdown fences
  const stripped = raw
    .split("\n")
    .filter((l) => !l.trim().startsWith("```"))
    .join("\n")
    .trim()

  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end === -1) return {}

  try {
    return JSON.parse(stripped.slice(start, end + 1)) as {
      social_suggestions?: unknown
      trademark_risk?: unknown
      reason?: unknown
    }
  } catch {
    return {}
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

  const { baseName, currentTld } = parsed.data

  // 2. Run Groq social/trademark analysis + RDAP alt-TLD checks in parallel
  const [analysisResult, rdapResults] = await Promise.allSettled([
    // 2a. Groq social + trademark analysis
    (async () => {
      const groq = getGroqClient()
      const prompt = buildSocialAnalysisPrompt(baseName)
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.fast,   // Fast model is fine for this small task
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 512,
      })
      return completion.choices[0]?.message?.content ?? ""
    })(),

    // 2b. Alternative TLD RDAP checks (exclude the current TLD)
    checkDomainsAvailability(
      ALT_TLDS
        .filter((tld) => tld !== currentTld)
        .map((tld) => `${baseName}${tld}`),
      4,
    ),
  ])

  // 3. Parse Groq output
  let socialSuggestions: string[] = []
  let trademarkRisk: DomainAnalysis["trademarkRisk"] = "medium"
  let trademarkReason = "Unable to assess trademark risk."

  if (analysisResult.status === "fulfilled") {
    const raw = parseAnalysisJson(analysisResult.value)

    if (Array.isArray(raw.social_suggestions)) {
      socialSuggestions = (raw.social_suggestions as unknown[])
        .filter((s): s is string => typeof s === "string")
        .slice(0, 5)
    }
    if (
      raw.trademark_risk === "low" ||
      raw.trademark_risk === "medium" ||
      raw.trademark_risk === "high"
    ) {
      trademarkRisk = raw.trademark_risk
    }
    if (typeof raw.reason === "string") {
      trademarkReason = raw.reason
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
    trademarkReason,
    altTlds,
  }

  return NextResponse.json(analysis)
}
