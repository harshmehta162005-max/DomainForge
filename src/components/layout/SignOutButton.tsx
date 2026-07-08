"use client"

import { LogOut } from "lucide-react"
import { useState } from "react"
import { SignOutDialog } from "@/components/ui/SignOutDialog"

/**
 * Client component for sign-out button.
 * Co-located with Header — keep small and focused.
 * Uses browser Supabase client (session is in cookies, cleared on sign out).
 */
export function SignOutButton() {
  const [open, setOpen] = useState(false)

  const handleSignOutClick = () => {
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleSignOutClick}
        title="Sign out"
        aria-label="Sign out"
        className="flex items-center justify-center h-8 w-8 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors duration-150"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>

      <SignOutDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
