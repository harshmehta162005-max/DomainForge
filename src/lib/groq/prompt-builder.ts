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
 * Builds the social handle analysis prompt.
 */
export function buildSocialAnalysisPrompt(baseName: string): string {
  return `For the domain base name "${baseName}", suggest 3-5 social handle variations (X, Instagram, GitHub).
Prioritize short, available-sounding handles.

Output JSON:
{
  "social_suggestions": ["@name", ...]
}

Return ONLY valid JSON. No markdown, no extra text.`
}

/**
 * Builds the detailed trademark risk assessment prompt.
 */
export function buildTrademarkAnalysisPrompt(baseName: string, businessDescription: string, categories: string[]): string {
  return `You are an expert trademark + branding risk assessment AI with deep knowledge of global trademark law, USPTO/EUIPO/WIPO databases, and brand protection best practices.
Task: Analyze the given domain base name for potential trademark conflicts and brand risk.
Input:

Domain base name: ${baseName}
Business context: ${businessDescription}
Categories: ${categories.join(", ")}

Instructions:
Perform a professional preliminary trademark risk assessment.
Rules:

Focus primarily on USPTO (US) as default, mention if EU/international risk is likely.
Consider exact matches, phonetic similarities, and common law usage.
Factor in the business category and description for relevance.
Be conservative: if in doubt, mark higher risk.
Never give legal advice — always include disclaimer.

Return ONLY this exact JSON structure:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": number, // 0-100
  "summary": "Short 1-sentence risk assessment",
  "keyReasons": ["array of 2-4 bullet points explaining risk"],
  "recommendedAction": "string (e.g. 'Safe to proceed with caution', 'Strongly recommend legal review', etc.)",
  "disclaimer": "This is a preliminary AI assessment only and does not constitute legal advice. Consult a qualified trademark attorney for proper clearance."
}

Evaluation Criteria (use these internally):

Exact or very close existing marks in relevant classes = High risk
Common dictionary words in generic categories = Lower risk
Invented/brandable names = Generally lower risk
Popular industries (tech, finance, health) = Higher chance of conflicts

Output Rules:

Return only valid JSON, nothing else.
Be honest and balanced.
Prioritize user safety.`
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
