import { z } from "zod"

// ─── Availability ─────────────────────────────────────────────────────────────

export const AvailabilityStatusSchema = z.enum([
  "available",
  "taken",
  "premium",
  "parked",      // v2.0: parked / for-resale domain
  "unknown",
  "unverified",  // v2.0: Tier 3 ccTLD — confirm on registry
  "checking",
])
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>

// ─── RDAP Tier ────────────────────────────────────────────────────────────────

export type RdapTier = "tier1" | "tier2" | "tier3"

// ─── Score Breakdown ──────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  brandability: number      // 0–100: invented name, no generic meaning
  typeability: number       // 0–100: easy to type / short length
  keywordRelevance: number  // 0–100: matches business description
  tldTrust: number          // 0–100: TLD credibility (com > xyz)
}

// ─── Social Handle ────────────────────────────────────────────────────────────

export type HandleStatus = "available" | "taken" | "unknown"

export interface SocialHandle {
  handle: string    // e.g. "@brewly"
  status: HandleStatus
}

export interface SocialHandles {
  twitter?: SocialHandle
  instagram?: SocialHandle
}

// ─── Domain Suggestion ────────────────────────────────────────────────────────

export const DomainSuggestionSchema = z.object({
  domain: z.string(),          // full: "brewly.ai"
  baseName: z.string(),        // "brewly"
  tld: z.string(),             // ".ai"
  available: z.boolean(),
  availabilityStatus: AvailabilityStatusSchema,
  rdapTier: z.enum(["tier1", "tier2", "tier3"]).default("tier1"),  // v2.0
  isParked: z.boolean().default(false),                             // v2.0
  parkedPriceEstimate: z.string().nullable().default(null),         // v2.0: e.g. "$1,000–$5,000"
  score: z.number().min(0).max(100),
  scoreBreakdown: z.object({   // v2.0: decomposed score
    brandability: z.number().min(0).max(100),
    typeability: z.number().min(0).max(100),
    keywordRelevance: z.number().min(0).max(100),
    tldTrust: z.number().min(0).max(100),
  }).nullable().default(null),
  explanation: z.string(),
  style: z.enum(["brandable", "compound", "invented", "keyword", "alliteration"]),
  priceEstimate: z.string().nullable(),
  registrarLinks: z.object({
    namecheap: z.string().url().optional(),
    godaddy: z.string().url().optional(),
    porkbun: z.string().url().optional(),
    cloudflare: z.string().url().optional(),
  }),
  socialHandles: z.object({   // v2.0: inline social availability
    twitter: z.object({ handle: z.string(), status: z.enum(["available", "taken", "unknown"]) }).optional(),
    instagram: z.object({ handle: z.string(), status: z.enum(["available", "taken", "unknown"]) }).optional(),
  }).nullable().default(null),
})
export type DomainSuggestion = z.infer<typeof DomainSuggestionSchema>

// ─── Tone Preset ─────────────────────────────────────────────────────────────

export const TonePresetSchema = z.enum([
  "playful",
  "corporate",
  "minimal",
  "bold",
  "technical",
])
export type TonePreset = z.infer<typeof TonePresetSchema>

export const TONE_PRESET_SLIDERS: Record<TonePreset, {
  modern: number; professional: number; brandable: number; short: number
}> = {
  playful:    { modern: 65, professional: 30, brandable: 80, short: 75 },
  corporate:  { modern: 50, professional: 90, brandable: 40, short: 60 },
  minimal:    { modern: 80, professional: 70, brandable: 60, short: 90 },
  bold:       { modern: 85, professional: 55, brandable: 85, short: 65 },
  technical:  { modern: 75, professional: 75, brandable: 50, short: 70 },
}

// ─── Generation Request ───────────────────────────────────────────────────────

export const GenerationPreferencesSchema = z.object({
  modern: z.number().min(0).max(100),
  cool: z.number().min(0).max(100),
  professional: z.number().min(0).max(100),
  short: z.number().min(0).max(100),
  memorable: z.number().min(0).max(100),
  brandable: z.number().min(0).max(100),
  length: z.enum(["short", "medium", "long"]).default("medium"),
})
export type GenerationPreferences = z.infer<typeof GenerationPreferencesSchema>

export const GenerationRequestSchema = z.object({
  businessDescription: z.string().min(10).max(500),
  categories: z.array(z.string()).min(1).max(5),
  targetAudience: z.string().min(3).max(200),
  problemSolved: z.string().min(5).max(300),
  preferences: GenerationPreferencesSchema,
  tlds: z.array(z.string()).optional().default([".com", ".io", ".ai", ".co", ".app", ".dev", ".xyz", ".so"]),
  count: z.number().min(5).max(50).default(18),
})
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>

// ─── Generation Response ──────────────────────────────────────────────────────

export const GenerationResponseSchema = z.object({
  suggestions: z.array(DomainSuggestionSchema),
  metadata: z.object({
    totalGenerated: z.number(),
    cached: z.number(),
    sessionId: z.string(),
    fallbackTriggered: z.boolean().default(false),
  }),
})
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>

// ─── Availability Check ───────────────────────────────────────────────────────

export const AvailabilityResultSchema = z.object({
  available: z.boolean(),
  status: AvailabilityStatusSchema,
  rdapTier: z.enum(["tier1", "tier2", "tier3"]).default("tier1"),
  isParked: z.boolean().default(false),
  checkedAt: z.string(),
  expiresAt: z.string().optional(),
  fromCache: z.boolean(),
})
export type AvailabilityResult = z.infer<typeof AvailabilityResultSchema>

// ─── Tone ─────────────────────────────────────────────────────────────────────

export const ToneSchema = z.enum([
  "professional",
  "playful",
  "technical",
  "minimal",
  "bold",
])
export type Tone = z.infer<typeof ToneSchema>

// ─── Domain Analysis (modal — social + trademark + alt TLDs) ─────────────────

export interface DomainTldResult {
  domain: string   // e.g. "brewly.net"
  tld: string      // e.g. ".net"
  status: AvailabilityStatus
  available: boolean
}

export interface DomainAnalysis {
  baseName: string
  socialSuggestions: string[]           // e.g. ["@brewly", "@brewlyhq"]
  trademarkRisk: "low" | "medium" | "high"
  trademarkReason: string
  altTlds: DomainTldResult[]            // alternative TLD availability
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code: string
  details?: unknown
}

// ─── Result Pattern ───────────────────────────────────────────────────────────

export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function err<E = ApiError>(error: E): Result<never, E> {
  return { ok: false, error }
}
