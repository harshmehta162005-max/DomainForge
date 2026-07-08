import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ─── GET /api/profile/sessions ────────────────────────────────────────────────
// Returns current session info (provider, last sign-in)

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    provider: (user.app_metadata?.provider as string) ?? "email",
    last_sign_in_at: user.last_sign_in_at ?? null,
    created_at: user.created_at,
    identities: (user.identities ?? []).map((i) => ({
      provider: i.provider,
      created_at: i.created_at,
    })),
  })
}

// ─── DELETE /api/profile/sessions ─────────────────────────────────────────────
// Signs out all sessions except the current one

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase.auth.signOut({ scope: "others" })

  if (error) {
    return NextResponse.json(
      { error: "Failed to sign out other sessions" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: "All other sessions signed out." })
}
