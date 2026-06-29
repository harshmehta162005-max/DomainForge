import { NextResponse } from "next/server"
import { z } from "zod"
import { computePromptCacheKey, getCachedGeneration, setCachedGeneration } from "@/lib/domain/cache"
import { runGenerationPipeline, type PipelineRequest } from "@/lib/domain/pipeline"

// ─── Request Schema ───────────────────────────────────────────────────────────

const GenerateRequestSchema = z.object({
  businessDescription: z.string().min(2).max(500),
  categories: z.array(z.string()).optional().default(["General"]),
  targetAudience: z.string().optional().default("entrepreneurs and startups"),
  problemSolved: z.string().optional().default("building a new online presence"),
  tonePreset: z.enum(["playful", "corporate", "minimal", "bold", "technical"]).optional(),
  preferences: z
    .object({
      modern: z.number().min(0).max(100).optional(),
      cool: z.number().min(0).max(100).optional(),
      professional: z.number().min(0).max(100).optional(),
      short: z.number().min(0).max(100).optional(),
      memorable: z.number().min(0).max(100).optional(),
      brandable: z.number().min(0).max(100).optional(),
      length: z.enum(["short", "medium", "long"]).optional(),
    })
    .optional(),
  tlds: z.array(z.string()).optional().default([".com", ".io", ".ai"]),
  count: z.number().min(5).max(20).optional().default(8),
  maxLength: z.number().min(4).max(20).optional().default(13),
  excludeWords: z.array(z.string()).optional().default([]),
  namingStyles: z.array(z.string()).optional().default([]),
  excludeNames: z.array(z.string()).optional().default([]),
})

type GenerateRequest = z.infer<typeof GenerateRequestSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeForCacheKey(req: GenerateRequest): string {
  return JSON.stringify({
    businessDescription: req.businessDescription.trim().toLowerCase(),
    categories: [...req.categories].sort(),
    targetAudience: req.targetAudience,
    problemSolved: req.problemSolved,
    tonePreset: req.tonePreset,
    tlds: [...req.tlds].sort(),
    count: req.count,
    excludeNames: [...req.excludeNames].sort(),
  })
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "INVALID_INPUT",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const req: GenerateRequest = parsed.data

  const cacheKeyInput = normalizeForCacheKey(req)
  const cacheKey = await computePromptCacheKey(cacheKeyInput)

  const cachedSuggestions = await getCachedGeneration(cacheKey)
  if (cachedSuggestions && cachedSuggestions.length > 0) {
    return NextResponse.json({
      suggestions: cachedSuggestions,
      metadata: {
        totalGenerated: cachedSuggestions.length,
        cached: cachedSuggestions.length,
        sessionId: crypto.randomUUID(),
        backfillRounds: 0,
        rdapCallCount: 0,
        warnings: []
      },
    })
  }

  const pipelineReq: PipelineRequest = {
    ...req,
    preferences: req.preferences
  }

  const result = await runGenerationPipeline(pipelineReq)

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { error: result.error?.error || "Pipeline failed", code: result.error?.code || "PIPELINE_ERROR" },
      { status: 502 },
    )
  }

  const { suggestions, backfillRounds, rdapCallCount, warnings } = result.data

  // Cache final results
  setCachedGeneration(cacheKey, suggestions).catch(() => {})

  return NextResponse.json({
    suggestions,
    metadata: {
      totalGenerated: suggestions.length,
      cached: 0,
      sessionId: crypto.randomUUID(),
      fallbackTriggered: backfillRounds > 0, // Legacy support if UI needs it
      backfillRounds,
      rdapCallCount,
      warnings
    },
  })
}
