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

    // ── 1. Delete avatar from Storage before deleting the user ──────────────
    // Avatar path is {user.id}/avatar.{ext} — we find the exact file by listing
    // the user's folder, so we don't need to guess the extension.
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from("avatars")
        .list(user.id)

      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f) => `${user.id}/${f.name}`)
        await supabaseAdmin.storage.from("avatars").remove(paths)
      }
    } catch {
      // Non-fatal — storage bucket may not exist or user never uploaded an avatar.
      // Proceed with account deletion regardless.
    }

    // ── 2. Delete the user from Supabase Auth ────────────────────────────────
    // This cascades to user_settings, watchlist, shortlist, activity_history
    // via the FK ON DELETE CASCADE constraints in the database.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error("Failed to delete user:", error)
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Delete account failed" }, { status: 500 })
  }
}
