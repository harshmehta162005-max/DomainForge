import { getGroqClient, GROQ_MODELS } from "@/lib/groq/client"
import { buildGenerationPrompt } from "@/lib/groq/prompt-builder"
import { captureError, captureWarn, captureEvent } from "@/lib/observability"
import { parseGenerationOutput, type RawSuggestion } from "@/lib/groq/parser"
import { checkDomainsAvailability, getTldTier, estimateParkedPrice } from "@/lib/domain/availability"
import { namecheapUrl, godaddyUrl } from "@/lib/utils"
import type { DomainSuggestion, ScoreBreakdown } from "@/types/domain"

// ─── Constants ────────────────────────────────────────────────────────────────

const TLD_BASE_PRICES: Record<string, number> = {
  ".com": 12, ".io": 39, ".ai": 89, ".co": 25, ".app": 18,
  ".dev": 12, ".net": 14, ".org": 12, ".sh": 28, ".tech": 9,
  ".xyz": 2,  ".gg": 22,  ".me": 9,   ".so": 29, ".run": 5,
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PipelineResponse {
  suggestions: DomainSuggestion[]
  backfillRounds: number
  rdapCallCount: number
  warnings: string[]
}

export interface PipelineRequest {
  businessDescription: string
  categories: string[]
  targetAudience: string
  problemSolved: string
  tonePreset?: any 
  preferences?: {
    modern?: number
    cool?: number
    professional?: number
    short?: number
    memorable?: number
    brandable?: number
    length?: "short" | "medium" | "long"
  }
  tlds: string[]
  count: number
  maxLength: number
  excludeWords: string[]
  namingStyles: string[]
  excludeNames?: string[]
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function estimateDomainPrice(tld: string, domainName: string, score: number): string {
  const base = TLD_BASE_PRICES[tld] ?? 15
  const lengthMult = domainName.length <= 5 ? 1.8 : domainName.length <= 7 ? 1.2 : 1.0
  const scoreMult = score >= 85 ? 1.5 : score >= 70 ? 1.1 : 1.0
  const price = Math.round(base * lengthMult * scoreMult)
  return `$${price}/yr`
}

function buildSuggestion(
  baseName: string,
  tld: string,
  rationale: string,
  style: DomainSuggestion["style"],
  score: number,
  scoreBreakdown: ScoreBreakdown | null,
  availResult: { available: boolean; status: DomainSuggestion["availabilityStatus"]; rdapTier: "tier1" | "tier2" | "tier3"; isParked: boolean }
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
    socialHandles: null,
  }
}

function computeLevenshtein(a: string, b: string): number {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null))
  for (let i = 0; i <= a.length; i += 1) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= b.length; j += 1) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      )
    }
  }
  return matrix[a.length][b.length]
}

function isNearDuplicate(nameA: string, nameB: string): boolean {
  if (nameA === nameB) return true
  const dist = computeLevenshtein(nameA, nameB)
  if (dist <= 1) return true

  const stripSuffix = (s: string) => {
    if (s.endsWith("s") || s.endsWith("-")) return s.slice(0, -1)
    if (s.length > 5) return s.slice(0, -1)
    return s
  }
  
  if (stripSuffix(nameA) === nameB || stripSuffix(nameB) === nameA || stripSuffix(nameA) === stripSuffix(nameB)) {
    return true
  }

  return false
}

// ─── LLM Generation Call ──────────────────────────────────────────────────────

async function generateCandidates(req: PipelineRequest, countOverride?: number): Promise<{ ok: boolean, data?: RawSuggestion[], error?: any }> {
  const count = countOverride ?? req.count
  const prefs = req.preferences ?? {}
  const prompt = buildGenerationPrompt({
    ...req,
    preferences: {
      modern: prefs.modern ?? 70,
      cool: prefs.cool ?? 60,
      professional: prefs.professional ?? 65,
      short: prefs.short ?? 70,
      memorable: prefs.memorable ?? 80,
      brandable: prefs.brandable ?? 75,
      length: prefs.length ?? "short",
    },
    count,
  }, req.tonePreset)

  const groq = getGroqClient()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let completion
  try {
    captureEvent("generation_requested", { count })
    completion = await groq.chat.completions.create({
      model: GROQ_MODELS.quality,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }, { signal: controller.signal })
  } catch (e) {
    clearTimeout(timeoutId)
    const isTimeout = e instanceof Error && (e.name === "AbortError" || e.message?.includes("aborted"))
    if (isTimeout) {
      captureError(e, { component: "LLM_Generation", reason: "timeout" })
      return { ok: false, error: { error: "AI generation timed out. Please try again.", code: "LLM_TIMEOUT" } }
    }
    captureError(e, { component: "LLM_Generation" })
    return { ok: false, error: { error: e instanceof Error ? e.message : "Generation failed", code: "LLM_ERROR" } }
  } finally {
    clearTimeout(timeoutId)
  }

  const rawOutput = completion.choices[0]?.message?.content ?? ""
  let parseResult = parseGenerationOutput(rawOutput)

  if (!parseResult.ok && parseResult.error.code === "PARSE_ERROR") {
    captureEvent("generation_parse_failed", { attempt: 1 })
    const retryController = new AbortController()
    const retryTimeout = setTimeout(() => retryController.abort(), 10000)
    try {
      const retryCompletion = await groq.chat.completions.create({
        model: GROQ_MODELS.quality,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: rawOutput },
          { role: "user", content: "Your last response was not valid JSON. Return ONLY the JSON object, nothing else." }
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }, { signal: retryController.signal })
      
      const retryOutput = retryCompletion.choices[0]?.message?.content ?? ""
      parseResult = parseGenerationOutput(retryOutput)
    } catch (e) {
      // ignore, fail through
    } finally {
      clearTimeout(retryTimeout)
    }
  }

  if (!parseResult.ok) {
    captureEvent("generation_parse_failed", { attempt: 2, final: true })
    return { ok: false, error: parseResult.error }
  }

  return { ok: true, data: parseResult.data }
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export async function runGenerationPipeline(req: PipelineRequest, isPrimaryTldParkedCheck = true): Promise<{ ok: boolean, data?: PipelineResponse, error?: any }> {
  let backfillRounds = 0
  let rdapCallCount = 0
  let warnings: string[] = []
  
  let currentExcludeNames = new Set((req.excludeNames || []).map(n => n.toLowerCase()))
  
  let finalRawSuggestions: RawSuggestion[] = []
  let availabilityMap = new Map<string, any>()
  
  const targetTlds = new Set(req.tlds)
  targetTlds.add(".com")
  targetTlds.add(".io")
  targetTlds.add(".ai")
  const tldList = Array.from(targetTlds)
  const primaryTld = req.tlds[0] ?? ".com"
  
  let targetCount = req.count
  const maxBackfillRounds = 2
  
  while (true) {
    const genResult = await generateCandidates({ ...req, excludeNames: Array.from(currentExcludeNames) }, targetCount)
    if (!genResult.ok && finalRawSuggestions.length === 0) {
      return { ok: false, error: genResult.error }
    }
    
    let generated = genResult.data || []
    
    const validRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    let normalized = generated.map(s => ({
      ...s,
      name: s.name.toLowerCase().trim()
    })).filter(s => {
      return validRegex.test(s.name) && s.name.length <= req.maxLength
    })
    
    let droppedCount = 0
    let deduped: RawSuggestion[] = []
    
    for (const s of normalized) {
      if (currentExcludeNames.has(s.name)) {
        droppedCount++
        continue
      }
      
      const duplicateIndex = deduped.findIndex(existing => isNearDuplicate(existing.name, s.name))
      if (duplicateIndex !== -1) {
        droppedCount++
        if (s.pre_score > deduped[duplicateIndex].pre_score) {
          deduped[duplicateIndex] = s
        }
      } else {
        deduped.push(s)
        currentExcludeNames.add(s.name)
      }
    }
    if (droppedCount > 0) {
      captureEvent("dedup_dropped", { count: droppedCount })
      warnings.push(`${droppedCount} names dropped as near-duplicates or excluded.`)
    }
    
    const domainsToCheck: { domain: string; isPrimary: boolean }[] = []
    for (const s of deduped) {
      for (const tld of tldList) {
        domainsToCheck.push({
           domain: `${s.name}${tld}`,
           isPrimary: tld === primaryTld && isPrimaryTldParkedCheck 
        })
      }
    }
    
    let roundAvailabilityMap = new Map<string, any>()
    try {
      const results = await checkDomainsAvailability(domainsToCheck.map(d => d.domain), 10, domainsToCheck)
      roundAvailabilityMap = results
      rdapCallCount += domainsToCheck.length
      captureEvent("rdap_call", { count: domainsToCheck.length })
    } catch (err) {
      captureWarn("RDAP Bulk Check Failed", { error: err })
    }
    
    for (const [k, v] of roundAvailabilityMap.entries()) {
      availabilityMap.set(k, v)
    }
    
    let validCountThisRound = 0
    for (const s of deduped) {
      let hasAvailable = false
      let allUnverified = true
      
      for (const tld of tldList) {
        const domain = `${s.name}${tld}`
        const avail = roundAvailabilityMap.get(domain)
        if (avail) {
          if (avail.status !== "unverified" && avail.status !== "unknown") {
            allUnverified = false
          }
          if (avail.available && (avail.rdapTier === "tier1" || avail.rdapTier === "tier2")) {
            hasAvailable = true
          }
        }
      }
      
      if (allUnverified) {
         warnings.push(`Domain checks for ${s.name} returned unverified/unknown status across all TLDs.`)
      }
      
      finalRawSuggestions.push(s)
      if (hasAvailable) validCountThisRound++
    }
    
    let totalValidAvailable = 0
    for (const s of finalRawSuggestions) {
      for (const tld of tldList) {
        const avail = availabilityMap.get(`${s.name}${tld}`)
        if (avail?.available && (avail.rdapTier === "tier1" || avail.rdapTier === "tier2")) {
          totalValidAvailable++
          break
        }
      }
    }
    
    if (totalValidAvailable >= req.count || backfillRounds >= maxBackfillRounds) {
      if (totalValidAvailable < req.count) {
        captureEvent("backfill_exhausted", { shortfall: req.count - totalValidAvailable })
      }
      break
    }
    
    backfillRounds++
    captureEvent("backfill_triggered", { round: backfillRounds, currentValid: totalValidAvailable })
    targetCount = req.count - totalValidAvailable
  }
  
  let finalSuggestions: DomainSuggestion[] = []
  
  for (const raw of finalRawSuggestions) {
    const primaryDomain = `${raw.name}${primaryTld}`
    const primaryAvail = availabilityMap.get(primaryDomain)
    
    finalSuggestions.push(
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
      )
    )
    
    const secondaries = req.tlds.slice(1)
    for (const tld of secondaries) {
      const domain = `${raw.name}${tld}`
      const avail = availabilityMap.get(domain)
      finalSuggestions.push(
        buildSuggestion(
          raw.name,
          tld,
          raw.rationale,
          raw.style,
          Math.max(0, raw.pre_score - 5),
          raw.score_breakdown ? { ...raw.score_breakdown, tldTrust: Math.max(0, raw.score_breakdown.tldTrust - 10) } : null,
          {
            available: avail?.available ?? false,
            status: avail?.status ?? "unknown",
            rdapTier: avail?.rdapTier ?? getTldTier(tld),
            isParked: avail?.isParked ?? false, 
          }
        )
      )
    }
  }
  
  finalSuggestions.sort((a, b) => {
    if (a.availabilityStatus === "available" && b.availabilityStatus !== "available") return -1
    if (b.availabilityStatus === "available" && a.availabilityStatus !== "available") return 1
    return b.score - a.score
  })
  
  finalSuggestions = finalSuggestions.slice(0, req.count * req.tlds.length)
  
  return {
    ok: true,
    data: {
      suggestions: finalSuggestions,
      backfillRounds,
      rdapCallCount,
      warnings
    }
  }
}
