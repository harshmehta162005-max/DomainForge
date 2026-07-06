import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

const supabaseAdmin = createSupabaseClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch only notification-worthy events (e.g., status_changed for availability/price drops)
  const { data, error } = await supabase
    .from("activity_history")
    .select("id, domain, event_type, note, created_at, is_read")
    .eq("user_id", user.id)
    .in("event_type", ["status_changed", "price_drop", "expiring"]) // Currently cron uses status_changed
    .order("created_at", { ascending: false })
    .limit(50) // reasonable max

  if (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }

  return NextResponse.json({ notifications: data ?? [] })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { ids?: string[], markAll?: boolean } = {}
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (body.markAll) {
    // Mark all as read
    const { error } = await supabaseAdmin
      .from("activity_history")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .in("event_type", ["status_changed", "price_drop", "expiring"])
      .eq("is_read", false)

    if (error) {
      return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
    }
  } else if (body.ids && Array.isArray(body.ids)) {
    // Mark specific as read
    const { error } = await supabaseAdmin
      .from("activity_history")
      .update({ is_read: true })
      .in("id", body.ids)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
