import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Schemas ─────────────────────────────────────────────────────────────────

const AddToShortlistSchema = z.object({
  domain: z.string().min(3).max(253),
  status: z
    .enum(["available", "taken", "premium", "unknown", "checking", "parked", "unverified"])
    .default("unknown"),
})

const RemoveFromShortlistSchema = z.object({
  domain: z.string().min(3).max(253),
})

// ─── GET /api/shortlist — return user's shortlist ────────────────────────────

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
    .from("shortlist")
    .select("id, domain, status, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch shortlist", code: "DB_ERROR" },
      { status: 500 },
    )
  }

  return NextResponse.json({ shortlist: data ?? [] })
}

// ─── POST /api/shortlist — add domain to shortlist ───────────────────────────

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

  const parsed = AddToShortlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { domain, status } = parsed.data

  const { data, error } = await supabase
    .from("shortlist")
    .upsert(
      { user_id: user.id, domain, status },
      { onConflict: "user_id,domain", ignoreDuplicates: false },
    )
    .select("id")
    .single()

  if (error) {
    console.error("[POST /api/shortlist] Supabase error:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: "Failed to save domain. Try again.", code: "DB_ERROR", detail: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ id: data.id, domain }, { status: 201 })
}

// ─── DELETE /api/shortlist — remove domain from shortlist ────────────────────

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

  const parsed = RemoveFromShortlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from("shortlist")
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
