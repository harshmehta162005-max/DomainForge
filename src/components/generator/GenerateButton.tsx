"use client"

import { Wand2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerateButtonProps {
  onClick: () => void
  loading: boolean
  phase: string
  disabled?: boolean
}

const PHASE_LABEL: Record<string, string> = {
  idle:       "Generate names",
  generating: "Generating…",
  checking:   "Checking availability…",
  done:       "Regenerate",
  error:      "Try again",
}

export function GenerateButton({ onClick, loading, phase, disabled }: GenerateButtonProps) {
  const label = PHASE_LABEL[phase] ?? "Generate names"
  const isLoading = loading || phase === "generating" || phase === "checking"

  return (
    <button
      id="generator-submit"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        "w-full h-11 flex items-center justify-center gap-2.5",
        "rounded-[4px] font-medium text-sm transition-all duration-150",
        "active:scale-[0.98]",
        isLoading || disabled
          ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
          : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:shadow-[0_0_28px_rgba(34,211,238,0.25)]"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <Wand2 className="h-4 w-4" strokeWidth={1.5} />
      )}
      {label}
    </button>
  )
}
