import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "./SignOutButton"

interface HeaderProps {
  showNewSearch?: boolean
}

/**
 * Sticky top navigation header — Server Component.
 * Reads auth state server-side so there is no hydration flash.
 *
 * design.md: h-14 (56px), bg-zinc-950/80 backdrop-blur-sm,
 * border-bottom zinc-800, logo Geist 600 + cyan-400 dot.
 */
export async function Header({ showNewSearch = false }: HeaderProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Abbreviate email: harshmehta162005@gmail.com → h***@gmail.com
  const displayEmail = user?.email
    ? `${user.email[0]}***@${user.email.split("@")[1]}`
    : null

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors duration-150"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-sm font-semibold tracking-tight">
            Domain<span className="text-cyan-400">Forge</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {showNewSearch && (
            <Link
              href="/"
              className="h-8 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150 flex items-center"
            >
              New search
            </Link>
          )}

          {user ? (
            // Authenticated — show email abbreviation + dashboard link + sign out
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="h-8 px-3 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150 flex items-center"
              >
                Dashboard
              </Link>
              <span className="text-xs text-zinc-600 font-mono hidden sm:block">
                {displayEmail}
              </span>
              <SignOutButton />
            </div>
          ) : (
            // Not authenticated — sign in link
            <Link
              href="/auth"
              className="h-8 px-3 rounded-[4px] bg-cyan-400 text-zinc-950 text-xs font-medium hover:bg-cyan-300 transition-colors duration-150 flex items-center"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
