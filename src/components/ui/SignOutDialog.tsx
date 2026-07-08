"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { LogOut } from "lucide-react"

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl p-0 overflow-hidden sm:rounded-xl max-w-sm">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            Sign out
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2 text-sm leading-relaxed">
            Are you sure you want to sign out of DomainForge? You'll need to log in again to access your watchlist and settings.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 px-6 py-4 flex flex-row gap-3 sm:justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isSigningOut}
            className="h-9 px-4 rounded-[4px] text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-9 px-5 rounded-[4px] text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSigningOut ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Signing out...
              </>
            ) : "Sign out"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
