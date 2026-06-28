import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth callback handler.
 * Supabase redirects here after Google OAuth sign-in and email confirmations.
 * Exchanges the auth code for a session, then redirects to the intended page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to sign-in with error flag
  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
