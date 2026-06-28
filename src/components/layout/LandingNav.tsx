import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "./SignOutButton"

/**
 * Landing page navigation bar — Server Component.
 * Reads auth state to show Sign In or user controls.
 * Separate from the main Header so the landing page can control its own styling.
 */
export async function LandingNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayEmail = user?.email
    ? `${user.email[0]}***@${user.email.split("@")[1]}`
    : null

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12">
      <span className="text-xl font-bold tracking-tight text-white">
        Domain<span className="text-orange-400">Forge</span>
      </span>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="border border-zinc-700 bg-zinc-800/60 rounded-[4px] px-4 py-1.5 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-xs text-zinc-600 font-mono hidden sm:block">{displayEmail}</span>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/auth"
            className="border border-zinc-700 bg-zinc-800/60 rounded-[4px] px-4 py-1.5 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
