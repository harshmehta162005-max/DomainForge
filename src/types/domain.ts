import { z } from "zod"

// ─── Availability ─────────────────────────────────────────────────────────────

export const AvailabilityStatusSchema = z.enum([
  "available",
  "taken",
  "premium",
  "unknown",
  "checking",
])
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>

// ─── Domain Suggestion ────────────────────────────────────────────────────────

export const DomainSuggestionSchema = z.object({
  domain: z.string(),          // full: "brewly.ai"
  baseName: z.string(),        // "brewly"
  tld: z.string(),             // ".ai"
  available: z.boolean(),
  availabilityStatus: AvailabilityStatusSchema,
  score: z.number().min(0).max(100),
  explanation: z.string(),
  style: z.enum(["brandable", "compound", "invented", "keyword", "alliteration"]),
  priceEstimate: z.string().nullable(),
  registrarLinks: z.object({
    namecheap: z.string().url().optional(),
    godaddy: z.string().url().optional(),
  }),
})
export type DomainSuggestion = z.infer<typeof DomainSuggestionSchema>

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
  tlds: z.array(z.string()).optional().default([".com", ".io", ".ai"]),
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
  }),
})
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>

// ─── Availability Check ───────────────────────────────────────────────────────

export const AvailabilityResultSchema = z.object({
  available: z.boolean(),
  status: AvailabilityStatusSchema,
  checkedAt: z.string(),
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
