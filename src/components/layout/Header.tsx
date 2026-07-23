import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "./SignOutButton"
import { NotificationBell } from "./NotificationBell"

interface HeaderProps {
  showNewSearch?: boolean
}

/**
 * Sticky top navigation header — Server Component.
 * Reads auth state server-side so there is no hydration flash.
 *
 * design.md: h-14 (56px), bg-zinc-950/80 backdrop-blur-sm,
 * border-bottom zinc-800, logo Geist 600 + cyan-400 dot.
 *
 * Responsive changes:
 * - px-4 sm:px-6 prevents content touching viewport edge on 320px
 * - All buttons use min-h-11 sm:h-8 for 44px touch targets on mobile
 *   while preserving compact 32px height on desktop
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

  // Shared button classes: min-h-11 (44px) on mobile, sm:h-8 (32px) on sm+
  const btnBase =
    "min-h-11 sm:h-8 px-3 rounded-[4px] text-xs flex items-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors duration-150"
        >
          <Image src="/logo-new.png" alt="DomainForge Logo" width={32} height={32} className="h-7 w-auto flex-shrink-0 object-contain" priority />
          <span className="text-sm font-semibold tracking-tight">
            Domain<span className="text-cyan-400">Forge</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {showNewSearch && (
            <Link
              href="/"
              className={`${btnBase} bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700`}
            >
              New search
            </Link>
          )}

          {user ? (
            // Authenticated — show email abbreviation + dashboard link + sign out
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className={`${btnBase} bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700`}
              >
                Dashboard
              </Link>
              <NotificationBell />
              <span className="text-xs text-zinc-600 font-mono hidden sm:block ml-2">
                {displayEmail}
              </span>
              <SignOutButton />
            </div>
          ) : (
            // Not authenticated — sign in link
            <Link
              href="/auth"
              className={`${btnBase} bg-cyan-400 text-zinc-950 font-medium hover:bg-cyan-300`}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
