# DomainForge — LLM Prompts & Dependencies
# Status: DRAFT — stored for reference, will be refined.
# These live here; actual implementations go in src/lib/groq/prompt-builder.ts

---

## PROMPT 1 — Domain Name Generation (Main)

**Used by:** `POST /api/generate`  
**Template file (future):** `src/lib/groq/prompt-builder.ts → buildGenerationPrompt()`

```
You are an expert branding + domain naming AI.

User Business:
Description: {{description}}
Categories: {{categories.join(', ')}}
Audience: {{audience.join(', ')}}
Problem: {{problem}}

Style Sliders (0-100):
Modern: {{modern}}, Cool: {{cool}}, Professional: {{professional}},
Short: {{short}}, Memorable: {{memorable}}, Brandable: {{brandable}}

Generate exactly 18 unique base names (no TLDs).

Rules:
- Strong mix: 40% brandable/invented, 30% compound, 20% keyword, 10% alliteration.
- Prioritize pronounceability and memorability.
- Max 13 characters preferred.
- Avoid existing big brands.

For each name return this exact JSON structure inside one array:

{
  "name": "string",
  "rationale": "2-3 sentence why it fits user input + sliders",
  "style": "brandable | compound | invented | keyword | alliteration",
  "pre_score": number (0-100)
}

Then, at the end, add a "ranked_suggestions" array sorted by pre_score descending.

Return ONLY valid JSON. No markdown, no extra text.
```

---

## PROMPT 2 — Social Handle + Trademark Analysis

**Used by:** Domain detail view / expand card action  
**Template file (future):** `src/lib/groq/prompt-builder.ts → buildSocialAnalysisPrompt()`

```
For the domain base name "{{baseName}}", suggest 3-5 variations and evaluate:

1. Likely social handle availability (X, Instagram, GitHub) - high/medium/low confidence.
2. Basic trademark risk (common word? invented?).

Output JSON:
{
  "base": "{{baseName}}",
  "social_suggestions": ["@name", ...],
  "trademark_risk": "low | medium | high",
  "reason": "explanation"
}
```

---

## PROMPT 3 — Refinement / Iteration

**Used by:** "Refine results" action on results page  
**Template file (future):** `src/lib/groq/prompt-builder.ts → buildRefinementPrompt()`

```
Previous suggestions were okay but need improvement. User wants more {{focus}} names.

Original input: [paste original]

Current suggestions: [paste current list]

Refine top 10. Make them {{new_direction}}. Keep JSON format from before.
```

---

## DEPENDENCIES — Package List

> To be used when initializing the project with `npm install`.

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "zod": "^3",
    "lucide-react": "^0.4",
    "zustand": "^4",
    "@upstash/redis": "^1",
    "resend": "^3",
    "json2csv": "^5",
    "date-fns": "^3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5",
    "eslint": "^8"
  }
}
```

> **Notes:**
> - `@upstash/redis` OR Supabase `domain_cache` table for availability caching — decide at Phase 1
> - `groq-sdk` missing from this list — add: `"groq-sdk": "^0"`
> - `react-hook-form` + `@hookform/resolvers` missing — add for GenerationForm
> - `@upstash/ratelimit` — add for Groq rate limiting middleware

---

## PROMPT VARIABLES — Type Reference

```typescript
// All template variables for prompt-builder.ts (future)
interface GenerationPromptVars {
  description: string       // "a coffee subscription service"
  categories: string[]      // ["food", "subscription", "ecommerce"]
  audience: string[]        // ["millennials", "remote workers"]
  problem: string           // "people forget to reorder coffee"
  // Sliders (0-100)
  modern: number
  cool: number
  professional: number
  short: number
  memorable: number
  brandable: number
}

interface SocialAnalysisPromptVars {
  baseName: string          // "brewly" (no TLD)
}

interface RefinementPromptVars {
  focus: string             // "shorter", "more technical", "more playful"
  originalInput: string     // serialized GenerationPromptVars
  currentSuggestions: string // JSON array of current results
  new_direction: string     // "3-5 chars max, invented words only"
}
```
