import type { GenerationRequest, TonePreset } from "@/types/domain"

// ─── Tone preset → natural language description ───────────────────────────────

const TONE_DESCRIPTIONS: Record<TonePreset, string> = {
  playful:   "playful, fun, and approachable — names that make people smile (think Slack, Canva, Notion)",
  corporate: "professional, trustworthy, and polished — names that inspire confidence in enterprise contexts",
  minimal:   "clean, simple, and short — minimalist names with no fluff or excess syllables",
  bold:      "strong, memorable, and impactful — names that command attention (think Stripe, Linear, Vercel)",
  technical: "technical, precise, and developer-friendly — names developers respect (think GitHub, Terraform)",
}

/**
 * Builds the Groq prompt for domain name generation.
 * Template vars come from the validated GenerationRequest.
 * v2.0: Now requests score_breakdown with sub-scores for each suggestion.
 * Never inline prompts in route handlers — always use this builder.
 */
export function buildGenerationPrompt(
  req: GenerationRequest & {
    maxLength?: number
    excludeWords?: string[]
    namingStyles?: string[]
    excludeNames?: string[]
  },
  tonePreset?: TonePreset,
): string {
  const {
    businessDescription, categories, targetAudience, problemSolved,
    preferences, tlds = [".com", ".io", ".ai", ".co", ".app", ".dev", ".xyz", ".so"], count,
    maxLength = 13, excludeWords = [], namingStyles = [], excludeNames = [],
  } = req

  // When a tone preset is active, include BOTH the descriptive text AND the numeric
  // slider values so the LLM gets the richest context. Previously the slider numbers
  // were silently dropped when a preset was selected.
  const toneDescription = tonePreset
    ? `Tone preset: ${TONE_DESCRIPTIONS[tonePreset]}\nStyle Sliders (0-100): Modern: ${preferences.modern}, Cool: ${preferences.cool}, Professional: ${preferences.professional}, Short: ${preferences.short}, Memorable: ${preferences.memorable}, Brandable: ${preferences.brandable}. Length preference: ${preferences.length}`
    : `Style Sliders (0-100): Modern: ${preferences.modern}, Cool: ${preferences.cool}, Professional: ${preferences.professional}, Short: ${preferences.short}, Memorable: ${preferences.memorable}, Brandable: ${preferences.brandable}. Length preference: ${preferences.length}`

  return `You are an expert branding + domain naming AI.

User Business:
Description: ${businessDescription}
Categories: ${categories.join(", ")}
Audience: ${targetAudience}
Problem: ${problemSolved}

${toneDescription}

Preferred TLDs: ${tlds.join(", ")}

Generate exactly ${count} unique base names (no TLDs).

Rules:
- Strong mix: ${namingStyles.length > 0 ? namingStyles.join(", ") + " styles only." : "40% brandable/invented, 30% compound, 20% keyword, 10% alliteration."}
- Prioritize pronounceability and memorability.
- Max ${maxLength} characters HARD LIMIT — do not exceed this length.
- Avoid existing big brands.${excludeWords.length > 0 ? `\n- Do NOT use any of these words or roots: ${excludeWords.join(", ")}.` : ""}${excludeNames.length > 0 ? `\n- Do NOT suggest any of these exact names again: ${excludeNames.join(", ")}.` : ""}
- Higher "Modern" slider = prefer invented/portmanteau words.
- Higher "Professional" slider = avoid playful suffixes (-ify, -ly abuse).

For each name return this EXACT JSON structure:

{
  "name": "string",
  "rationale": "1 sentence max: why it fits the business description",
  "style": "brandable | compound | invented | keyword | alliteration",
  "pre_score": number (0-100, overall fit score),
  "score_breakdown": {
    "brandability": number (0-100, how invented/original vs generic),
    "typeability": number (0-100, ease of typing and short length; max for ≤6 chars),
    "keyword_relevance": number (0-100, how well it matches business description),
    "tld_trust": number (0-100, based on TLD credibility; .com=100, .io=90, .ai=88, .co=80, .app=75, .dev=75, others scale down)
  }
}

Return a JSON object with a "ranked_suggestions" array sorted by pre_score descending.
Return ONLY valid JSON. No markdown, no extra text.`
}

/**
 * Builds the social handle + trademark analysis prompt.
 */
export function buildSocialAnalysisPrompt(baseName: string): string {
  return `For the domain base name "${baseName}", suggest 3-5 handle variations and evaluate:

1. Likely social handle availability (X, Instagram, GitHub) - high/medium/low confidence.
2. Basic trademark risk (common word? invented?).

Output JSON:
{
  "base": "${baseName}",
  "social_suggestions": ["@name", ...],
  "trademark_risk": "low | medium | high",
  "reason": "explanation"
}

Return ONLY valid JSON. No markdown, no extra text.`
}

/**
 * Builds the refinement prompt for iterating on existing suggestions.
 */
export function buildRefinementPrompt(
  focus: string,
  originalInput: string,
  currentSuggestions: string,
  newDirection: string,
): string {
  return `Previous suggestions need improvement. User wants more ${focus} names.

Original input: ${originalInput}

Current suggestions: ${currentSuggestions}

Refine the top 10. Make them ${newDirection}. Keep exact same JSON format including score_breakdown.

Return ONLY valid JSON. No markdown, no extra text.`
}
