import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Schemas ─────────────────────────────────────────────────────────────────

const AddToWatchlistSchema = z.object({
  domain: z.string().min(3).max(253),
  status: z
    .enum(["available", "taken", "premium", "unknown", "checking", "parked", "unverified"])
    .default("unknown"),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
  price_estimate: z.string().nullable().optional(),
})

const RemoveFromWatchlistSchema = z.object({
  domain: z.string().min(3).max(253),
})

// ─── GET /api/watchlist — return user's watchlist ────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 },
    )
  }

  const { data, error } = await supabase
    .from("watchlist")
    .select("id, domain, status, notes, created_at, score, tags, price_estimate, alert_enabled, social_x, social_ig, social_x_available, social_ig_available, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch watchlist", code: "DB_ERROR" },
      { status: 500 },
    )
  }

  return NextResponse.json({ watchlist: data ?? [] })
}

// ─── POST /api/watchlist — add domain to watchlist ───────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = AddToWatchlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { domain, status, score = 0, tags = [], price_estimate = null } = parsed.data

  const { data, error } = await supabase
    .from("watchlist")
    .upsert(
      { user_id: user.id, domain, status, score, tags, price_estimate },
      { onConflict: "user_id,domain", ignoreDuplicates: false },
    )
    .select("id")
    .single()

  if (error) {
    console.error("[POST /api/watchlist] Supabase error:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: "Failed to save domain. Try again.", code: "DB_ERROR", detail: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ id: data.id, domain }, { status: 201 })
}

// ─── DELETE /api/watchlist — remove domain from watchlist ────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = RemoveFromWatchlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("domain", parsed.data.domain)

  if (error) {
    return NextResponse.json(
      { error: "Failed to remove domain. Try again.", code: "DB_ERROR" },
      { status: 500 },
    )
  }

  return NextResponse.json({ removed: parsed.data.domain })
}

// ─── PATCH /api/watchlist — update domain details ────────────────────────────

const UpdateWatchlistSchema = z.object({
  domain: z.string().min(3).max(253),
  alert_enabled: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  social_x: z.string().nullable().optional(),
  social_ig: z.string().nullable().optional(),
  social_x_available: z.boolean().nullable().optional(),
  social_ig_available: z.boolean().nullable().optional(),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["available", "taken", "premium", "unknown", "checking", "parked", "unverified"]).optional(),
  price_estimate: z.string().nullable().optional(),
})

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHENTICATED" },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = UpdateWatchlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { domain, ...updates } = parsed.data
  
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ updated: domain })
  }

  const { data, error } = await supabase
    .from("watchlist")
    .update(updates)
    .eq("user_id", user.id)
    .eq("domain", domain)
    .select("id")
    .single()

  if (error) {
    console.error("[PATCH /api/watchlist] Supabase error:", error)
    return NextResponse.json(
      { error: "Failed to update domain. Try again.", code: "DB_ERROR" },
      { status: 500 },
    )
  }

  return NextResponse.json({ updated: domain })
}
