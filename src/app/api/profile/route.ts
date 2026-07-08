import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// ─── Validation ───────────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  display_name: z.string().max(50).nullable().optional(),
  bio: z.string().max(160).nullable().optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores")
    .nullable()
    .optional(),
  avatar_url: z.string().url().nullable().optional(),
})

// ─── GET /api/profile ─────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch user_settings row
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select(
      "plan, display_name, avatar_url, bio, username, notif_available, notif_expiry, notif_price, weekly_digest"
    )
    .eq("user_id", user.id)
    .single()

  if (settingsError && settingsError.code !== "PGRST116") {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Fetch watchlist count
  const { count: watchlistCount } = await supabase
    .from("watchlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch shortlist count
  const { count: shortlistCount } = await supabase
    .from("shortlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch generation count from activity_history
  const { count: generationCount } = await supabase
    .from("activity_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "domain_generated")

  const profile = {
    // Auth fields
    email: user.email ?? "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    provider: (user.app_metadata?.provider as string) ?? "email",
    // Settings fields
    plan: settings?.plan ?? "free",
    display_name: settings?.display_name ?? null,
    avatar_url: settings?.avatar_url ?? null,
    bio: settings?.bio ?? null,
    username: settings?.username ?? null,
    notif_available: settings?.notif_available ?? true,
    notif_expiry: settings?.notif_expiry ?? true,
    notif_price: settings?.notif_price ?? false,
    weekly_digest: settings?.weekly_digest ?? true,
    // Stats
    watchlist_count: watchlistCount ?? 0,
    shortlist_count: shortlistCount ?? 0,
    generation_count: generationCount ?? 0,
  }

  return NextResponse.json({ profile })
}

// ─── PATCH /api/profile ───────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    )
  }

  const updates = parsed.data

  // If username is being set, check uniqueness (case-insensitive)
  if (updates.username !== undefined && updates.username !== null) {
    const { data: existing } = await supabase
      .from("user_settings")
      .select("user_id")
      .ilike("username", updates.username)
      .neq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      )
    }
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
    .select(
      "plan, display_name, avatar_url, bio, username, notif_available, notif_expiry, notif_price, weekly_digest"
    )
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
