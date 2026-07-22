"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!open) return null

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      setIsSigningOut(false)
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[8px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <LogOut className="h-5 w-5 text-red-500" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-100">Sign out</h3>
            <p className="text-sm text-zinc-500 mt-1">See you soon!</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-300">
            Are you sure you want to sign out of DomainForge? You'll need to log in again to access your watchlist and settings.
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSigningOut}
            className="h-9 px-4 rounded-[4px] text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-9 px-5 rounded-[4px] bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95"
          >
            {isSigningOut ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Signing out...
              </>
            ) : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  )
}
