import type { GenerationRequest } from "@/types/domain"

/**
 * Builds the Groq prompt for domain name generation.
 * Template vars come from the validated GenerationRequest.
 * Never inline prompts in route handlers — always use this builder.
 */
export function buildGenerationPrompt(req: GenerationRequest): string {
  const { businessDescription, categories, targetAudience, problemSolved, preferences, tlds = [".com", ".io", ".ai"], count } = req

  return `You are an expert branding + domain naming AI.

User Business:
Description: ${businessDescription}
Categories: ${categories.join(", ")}
Audience: ${targetAudience}
Problem: ${problemSolved}

Style Sliders (0-100):
Modern: ${preferences.modern}, Cool: ${preferences.cool}, Professional: ${preferences.professional},
Short: ${preferences.short}, Memorable: ${preferences.memorable}, Brandable: ${preferences.brandable}
Length preference: ${preferences.length}

Preferred TLDs: ${tlds.join(", ")}

Generate exactly ${count} unique base names (no TLDs).

Rules:
- Strong mix: 40% brandable/invented, 30% compound, 20% keyword, 10% alliteration.
- Prioritize pronounceability and memorability.
- Max 13 characters preferred (shorter = higher score if Short slider > 70).
- Avoid existing big brands.
- Higher "Modern" slider = prefer invented/portmanteau words.
- Higher "Professional" slider = avoid playful suffixes (-ify, -ly abuse).

For each name return this exact JSON structure inside one array:

{
  "name": "string",
  "rationale": "1 sentence max: why it fits",
  "style": "brandable | compound | invented | keyword | alliteration",
  "pre_score": number (0-100)
}

Then add a "ranked_suggestions" array sorted by pre_score descending.

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

Refine the top 10. Make them ${newDirection}. Keep exact same JSON format.

Return ONLY valid JSON. No markdown, no extra text.`
}
