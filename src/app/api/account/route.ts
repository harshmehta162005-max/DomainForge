import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

export async function DELETE() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Must use the service role key to delete users via the admin API
    const supabaseAdmin = createAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error("Failed to delete user:", error)
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    // Note: Due to foreign key constraints with ON DELETE CASCADE, 
    // the user's data in user_settings and watchlist will automatically be deleted.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Delete account failed" }, { status: 500 })
  }
}
