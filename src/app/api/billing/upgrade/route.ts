import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"

// Service role client — only the server can write the plan column
const supabaseAdmin = createSupabaseClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
  // 1. Verify the caller is a real logged-in user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Use service role to write plan — users cannot do this from the client side
  const { error } = await supabaseAdmin
    .from("user_settings")
    .upsert({ user_id: user.id, plan: "pro" }, { onConflict: "user_id" })

  if (error) {
    console.error("[POST /api/billing/upgrade] Supabase error:", error)
    return NextResponse.json({ error: "Failed to upgrade plan." }, { status: 500 })
  }

  return NextResponse.json({ success: true, plan: "pro" })
}
