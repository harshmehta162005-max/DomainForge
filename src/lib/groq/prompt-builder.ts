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
 * v2: Structured scoring rubric, category risk modifiers, phonetic analysis,
 * multi-jurisdiction awareness, and enforced JSON output with confidence level.
 */
export function buildTrademarkAnalysisPrompt(baseName: string, businessDescription: string, categories: string[]): string {
  const categoryList = categories.join(", ")
  const highRiskCategories = ["Technology", "Software", "Finance", "Health", "Fintech", "SaaS", "AI", "Crypto", "Banking", "Insurance", "Pharma", "Legal"]
  const isHighRiskCategory = categories.some(c => highRiskCategories.some(h => c.toLowerCase().includes(h.toLowerCase())))
  const categoryRisk = isHighRiskCategory
    ? "⚠️ HIGH-SCRUTINY CATEGORY: Technology, Finance, and Health industries have the most trademark filings globally. Apply extra caution."
    : "Standard scrutiny applies to this category."

  return `You are a senior trademark risk analyst with 15+ years of experience in brand clearance for startups and enterprises. You have deep knowledge of USPTO, EUIPO, WIPO, and common law trademark principles.

ANALYSIS TARGET:
- Domain base name: "${baseName}"
- Business context: ${businessDescription}
- Industry categories: ${categoryList}
- ${categoryRisk}

TASK: Perform a thorough preliminary trademark risk clearance assessment.

EVALUATION FRAMEWORK (score each internally, sum for riskScore 0-100):

1. EXACT MATCH RISK (0-40 pts):
   - Is "${baseName}" likely registered as an exact trademark in related Nice Classes? (USPTO IC 9, 35, 36, 42 are most common for tech)
   - Common/dictionary words = lower risk. Invented/coined words = lower risk. Famous brand names = highest risk.

2. PHONETIC / VISUAL SIMILARITY (0-25 pts):
   - Does "${baseName}" sound like or look confusingly similar to any well-known brand?
   - Consider: sounds-like (Lyft/Lift), looks-like (Gogle/Google), abbreviated (MSFT/Microsoft)

3. CATEGORY DENSITY (0-20 pts):
   - How saturated is the trademark registry in this specific industry?
   - Generic tech terms ("cloud", "nexus", "core") in tech = high saturation risk

4. GEOGRAPHIC SCOPE (0-15 pts):
   - US risk is the primary consideration. Also flag if EU or international risk is elevated.
   - Consider: Is this a global word with strong associations in other languages?

RISK CALIBRATION:
- riskScore 0-30 → riskLevel "low" (safe to proceed with standard caution)
- riskScore 31-60 → riskLevel "medium" (proceed carefully, consider attorney review)
- riskScore 61-100 → riskLevel "high" (strong conflict likely, legal review strongly recommended)

IMPORTANT RULES:
- Never fabricate specific trademark numbers or case citations. Speak in probability terms.
- Be conservative: when in doubt, rate higher.
- Always include the disclaimer. Never give actual legal advice.
- Invented/portmanteau names (e.g., "Zapier", "Twilio") generally score lower risk.
- Single common English words in competitive tech ("signal", "arc", "flow") score higher.

REQUIRED OUTPUT — Return ONLY this exact JSON, nothing else:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": <number 0-100>,
  "confidence": "low" | "medium" | "high",
  "summary": "<One crisp sentence: the core risk finding for '${baseName}' in the ${categoryList} space>",
  "keyReasons": [
    "<Reason 1: most significant risk factor or clearance point>",
    "<Reason 2: phonetic/visual similarity finding>",
    "<Reason 3: category/industry saturation note>",
    "<Reason 4 (optional): geographic or international consideration>"
  ],
  "usptoDatabaseNote": "<Brief note on whether '${baseName}' resembles any well-known US marks in classes 9/35/42, or if the name appears sufficiently distinctive>",
  "recommendedAction": "<Specific, actionable next step — e.g., 'Safe to proceed; run a free TESS search as a precaution', or 'Retain a trademark attorney before filing'>",
  "disclaimer": "This is a preliminary AI-based risk estimate. It does not constitute legal advice and does not replace a professional trademark clearance search. Consult a qualified trademark attorney before filing or commercial use."
}`
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
