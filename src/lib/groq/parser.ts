import { ok, err, type Result } from "@/types/domain"

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_STYLES = ["brandable", "compound", "invented", "keyword", "alliteration"] as const
type DomainStyle = (typeof VALID_STYLES)[number]

export interface RawSuggestion {
  name: string
  rationale: string
  style: DomainStyle
  pre_score: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStyle(s: unknown): DomainStyle {
  if (typeof s !== "string") return "brandable"
  const lower = s.toLowerCase().trim()
  return (VALID_STYLES as readonly string[]).includes(lower)
    ? (lower as DomainStyle)
    : "brandable"
}

/** Safely read a string field from a plain object */
function str(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]
  return typeof v === "string" ? v.trim() : ""
}

/** Safely read a number field from a plain object */
function num(obj: Record<string, unknown>, key: string, fallback: number): number {
  const v = obj[key]
  if (typeof v === "number" && !Number.isNaN(v)) return Math.min(100, Math.max(0, v))
  if (typeof v === "string") {
    const n = parseFloat(v)
    if (!Number.isNaN(n)) return Math.min(100, Math.max(0, n))
  }
  return fallback
}

/** Convert any parsed value into a RawSuggestion — never throws */
function extractSuggestion(raw: unknown): RawSuggestion | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  const name = str(obj, "name") || str(obj, "domain_name") || str(obj, "domain")
  if (!name) return null // Skip items with no name

  return {
    name,
    rationale: str(obj, "rationale") || str(obj, "reason") || str(obj, "description"),
    style: normalizeStyle(obj.style ?? obj.type ?? obj.category),
    pre_score: num(obj, "pre_score", 0) || num(obj, "score", 50),
  }
}

// ─── JSON extractor ───────────────────────────────────────────────────────────

/**
 * Find the end position of a JSON value starting at `start`.
 * Properly handles brackets/braces inside string values.
 * Returns -1 if the JSON is unclosed (truncated output).
 */
function findJsonEnd(s: string, start: number): number {
  const openChar = s[start]
  const closeChar = openChar === "[" ? "]" : "}"
  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < s.length; i++) {
    const c = s[i]

    if (escape) { escape = false; continue }
    if (c === "\\" && inString) { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue

    if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1 // Unclosed
}

/**
 * Robustly extract a JSON string from raw LLM output.
 * Handles: bare JSON, code fences, text before/after JSON,
 * bare arrays → wrapped as {suggestions:[...]}.
 */
function extractJsonString(raw: string): string {
  // 1. Remove markdown code fence lines
  let s = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("```"))
    .join("\n")
    .trim()

  // 2. Find the first [ or { and use proper bracket matching
  const firstBrace = s.indexOf("{")
  const firstBracket = s.indexOf("[")

  // Prefer [ if it comes before {
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const end = findJsonEnd(s, firstBracket)
    if (end !== -1) {
      return `{"suggestions":${s.slice(firstBracket, end + 1)}}`
    }
  }

  if (firstBrace !== -1) {
    const end = findJsonEnd(s, firstBrace)
    if (end !== -1) {
      return s.slice(firstBrace, end + 1)
    }
  }

  // Fallback — return trimmed text and let JSON.parse report the error
  return s
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate raw Groq JSON output.
 * Uses manual field extraction — never fails on schema mismatches.
 * Returns a Result — caller handles the error case.
 */
export function parseGenerationOutput(raw: string): Result<RawSuggestion[]> {
  const cleaned = extractJsonString(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    console.error("[parser] JSON.parse failed:", msg, "\nfirst 400 chars:", cleaned.slice(0, 400))
    return err({ error: `LLM returned invalid JSON: ${msg}`, code: "PARSE_ERROR" })
  }

  // Accept both top-level array and {suggestions:[...], ranked_suggestions:[...]}
  let rawItems: unknown[] = []

  if (Array.isArray(parsed)) {
    rawItems = parsed
  } else if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>
    // Prefer ranked_suggestions, fall back to suggestions
    const items = obj.ranked_suggestions ?? obj.suggestions
    if (Array.isArray(items)) {
      rawItems = items
    }
  }

  const suggestions = rawItems
    .map(extractSuggestion)
    .filter((s): s is RawSuggestion => s !== null)
    .slice(0, 20) // Safety cap

  if (suggestions.length === 0) {
    console.error("[parser] no valid suggestions extracted. parsed type:", typeof parsed)
    return err({ error: "LLM returned no usable suggestions", code: "EMPTY_OUTPUT" })
  }

  console.log("[parser] extracted", suggestions.length, "suggestions. First:", suggestions[0]?.name)
  return ok(suggestions)
}
