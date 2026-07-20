import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "./SignOutButton"

/**
 * Landing page navigation bar — Server Component.
 * Reads auth state to show Sign In or user controls.
 * Separate from the main Header so the landing page can control its own styling.
 *
 * Responsive changes:
 * - px-4 sm:px-6 md:px-12 prevents edge bleed on 320px
 * - min-h-11 sm:min-h-0 on buttons → 44px touch target on mobile, auto on sm+
 */
export async function LandingNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Shared class: 44px touch target on mobile, padding-driven height on sm+
  const btnCls =
    "min-h-11 sm:min-h-0 border border-zinc-700 bg-zinc-800/60 rounded-[4px] px-4 py-1.5 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"

  return (
    <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4">
      <span className="text-xl font-bold tracking-tight text-white">
        Domain<span className="text-orange-400">Forge</span>
      </span>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link href="/dashboard" className={btnCls}>
              Dashboard
            </Link>
            <SignOutButton />
          </>
        ) : (
          <Link href="/auth" className={btnCls}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
