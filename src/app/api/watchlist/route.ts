import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Schemas ─────────────────────────────────────────────────────────────────

const AddToWatchlistSchema = z.object({
  domain: z.string().min(3).max(253),
  status: z
    .enum(["available", "taken", "premium", "unknown", "checking"])
    .default("unknown"),
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
    .select("id, domain, status, notes, created_at")
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

  const { domain, status } = parsed.data

  const { data, error } = await supabase
    .from("watchlist")
    .upsert(
      { user_id: user.id, domain, status },
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

// ─── PATCH /api/watchlist — update domain alert status ───────────────────────

const UpdateWatchlistSchema = z.object({
  domain: z.string().min(3).max(253),
  alert_enabled: z.boolean(),
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

  const { domain, alert_enabled } = parsed.data

  const { data, error } = await supabase
    .from("watchlist")
    .update({ alert_enabled })
    .eq("user_id", user.id)
    .eq("domain", domain)
    .select("id, alert_enabled")
    .single()

  if (error) {
    console.error("[PATCH /api/watchlist] Supabase error:", error)
    return NextResponse.json(
      { error: "Failed to update domain. Try again.", code: "DB_ERROR" },
      { status: 500 },
    )
  }

  return NextResponse.json({ updated: domain, alert_enabled: data.alert_enabled })
}
