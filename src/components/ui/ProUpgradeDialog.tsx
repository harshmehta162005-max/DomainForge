"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Sparkles, Zap, ArrowRight } from "lucide-react"

interface ProUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Short feature name shown in the dialog, e.g. "Auto-check alerts" */
  featureName?: string
}

const PRO_PERKS = [
  "Up to 500 domains in your watchlist",
  "Up to 200 domains in your shortlist",
  "Automated availability check alerts",
  "Generate up to 20 domain names per batch",
  "Export watchlist & account data",
]

export function ProUpgradeDialog({
  open,
  onOpenChange,
  featureName,
}: ProUpgradeDialogProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push("/dashboard/billing")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl p-0 overflow-hidden sm:rounded-xl w-[90vw] sm:w-full max-w-[340px] sm:max-w-md [&>button]:cursor-pointer">
        {/* Top gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600" />

        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-cyan-950/60 border border-cyan-900/60 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              Pro Feature
            </span>
          </div>
          <DialogTitle className="text-xl font-semibold text-zinc-100">
            {featureName
              ? `${featureName} requires Pro`
              : "Upgrade to DomainForge Pro"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2 text-sm leading-relaxed">
            {featureName
              ? `${featureName} is available on the Pro plan. Upgrade to unlock this and all other Pro features.`
              : "Unlock the full power of DomainForge with our Pro plan."}
          </DialogDescription>
        </DialogHeader>

        {/* Perks list */}
        <div className="px-6 pt-5" style={{ paddingBottom: "2rem" }}>
          <ul className="space-y-3">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-zinc-800 bg-zinc-950/50 px-6 py-5 flex flex-row items-center justify-between">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-[4px] text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            className="h-9 px-5 rounded-[4px] text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-colors flex items-center gap-2 cursor-pointer"
          >
            Upgrade to Pro
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
