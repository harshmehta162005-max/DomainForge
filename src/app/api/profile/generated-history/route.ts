import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ─── GET /api/profile/generated-history ──────────────────────────────────────
// Returns all domain_generated events for the current user, newest first.
// Used by the "View all" dialog on the profile overview tab.

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("activity_history")
    .select("id, domain, created_at")
    .eq("user_id", user.id)
    .eq("event_type", "domain_generated")
    .order("created_at", { ascending: false })
    .limit(200) // generous cap — all practical history

  if (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }

  return NextResponse.json({ domains: data ?? [] })
}
