import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const UpdateSettingsSchema = z.object({
  marketing_emails:    z.boolean().optional(),
  weekly_digest:       z.boolean().optional(),
  security_alerts:     z.boolean().optional(),
  notif_available:     z.boolean().optional(),
  notif_expiry:        z.boolean().optional(),
  notif_price:         z.boolean().optional(),
  notif_master:        z.boolean().optional(),
  notif_frequency:     z.enum(["immediate", "daily", "weekly"]).optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end:     z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone:            z.string().max(64).optional(),
  default_tlds:        z.string().optional(),
  auto_check:          z.boolean().optional(),
  check_interval:      z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("plan, marketing_emails, weekly_digest, security_alerts, notif_available, notif_expiry, notif_price, notif_master, notif_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, default_tlds, auto_check, check_interval")
    .eq("user_id", user.id)
    .single()

  if (error && error.code !== "PGRST116") { // PGRST116 is not found
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ settings: data || null })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = UpdateSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  }

  // If trying to enable auto_check, enforce Pro plan
  if (parsed.data.auto_check) {
    const { data: userPlanData } = await supabase
      .from("user_settings")
      .select("plan")
      .eq("user_id", user.id)
      .single()

    if (userPlanData?.plan !== "pro") {
      return NextResponse.json({ error: "Pro plan required for auto check" }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
