"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

/**
 * Client component for sign-out button.
 * Co-located with Header — keep small and focused.
 * Uses browser Supabase client (session is in cookies, cleared on sign out).
 */
export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      title="Sign out"
      aria-label="Sign out"
      className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150"
    >
      <LogOut className="h-3.5 w-3.5" />
    </button>
  )
}
