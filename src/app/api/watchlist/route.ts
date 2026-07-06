import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import { env } from "@/lib/env"
import { WatchlistLimitEmail } from "@/emails/WatchlistLimitEmail"
import * as React from "react"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

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
    .select("id, domain, status, notes, created_at, score, tags, price_estimate, alert_enabled, notify_frequency, notification_preferences, social_x, social_ig, social_x_available, social_ig_available, expires_at")
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

  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("plan")
    .eq("user_id", user.id)
    .single()

  const isPro = userSettings?.plan === "pro"
  const MAX_LIMIT = isPro ? 500 : 50
  const WARNING_THRESHOLD = isPro ? 450 : 40

  const { count, error: countError } = await supabase
    .from("watchlist")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)

  if (countError) {
    return NextResponse.json({ error: "Failed to check watchlist limit." }, { status: 500 })
  }

  const currentCount = count || 0

  if (currentCount >= MAX_LIMIT) {
    return NextResponse.json(
      { error: `${isPro ? 'Pro' : 'Free tier'} limit reached. You can only monitor up to ${MAX_LIMIT} domains.`, code: "LIMIT_REACHED" },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from("watchlist")
    .upsert(
      { 
        user_id: user.id, 
        domain, 
        status, 
        score, 
        tags, 
        price_estimate,
        created_at: new Date().toISOString()
      },
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

  // Log to activity_history
  await supabase.from("activity_history").insert({
    user_id: user.id,
    domain,
    event_type: "saved",
    note: `Saved to watchlist — ${status}`,
  })

  // Send warning email if exactly hitting the threshold
  if (currentCount + 1 === WARNING_THRESHOLD && resend && user.email) {
    const firstName = user.email.split("@")[0].split(".")[0]
    const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
    
    await resend.emails.send({
      from: "DomainForge Alerts <alerts@domainforge.ai>",
      to: user.email,
      subject: "Action Required: Watchlist limit approaching",
      react: React.createElement(WatchlistLimitEmail, {
        userName,
        appUrl: env.NEXT_PUBLIC_APP_URL,
        currentCount: WARNING_THRESHOLD,
        maxLimit: MAX_LIMIT
      })
    }).catch(console.error)
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

  // Log to activity_history
  await supabase.from("activity_history").insert({
    user_id: user.id,
    domain: parsed.data.domain,
    event_type: "removed",
    note: "Removed from watchlist",
  })

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
  notify_frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
  notification_preferences: z.object({
    availability: z.boolean(),
    price_drop: z.boolean(),
    expiration: z.boolean(),
  }).optional(),
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

  // Enforce Pro feature for auto-check (alert_enabled)
  if (updates.alert_enabled === true) {
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("plan")
      .eq("user_id", user.id)
      .single()

    if (userSettings?.plan !== "pro") {
      return NextResponse.json(
        { error: "Auto-check alerts require the Pro plan.", code: "PRO_REQUIRED" },
        { status: 403 }
      )
    }
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

  // If the status was updated (e.g. background check finished after quick-add), fix the history note
  if (updates.status) {
    await supabase
      .from("activity_history")
      .update({ note: `Saved to watchlist — ${updates.status}` })
      .eq("user_id", user.id)
      .eq("domain", domain)
      .eq("event_type", "saved")
      .like("note", "%unknown%")
  }

  return NextResponse.json({ updated: domain })
}
