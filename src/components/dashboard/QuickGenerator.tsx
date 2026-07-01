"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuickGenerator() {
  const [keywords, setKeywords] = useState("")
  const router = useRouter()

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (keywords.trim().length < 3) return
    // Navigate to the simple landing page generator route
    sessionStorage.setItem("df_description", keywords.trim())
    router.push("/generate")
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">Quick generator</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Fast-launch a generation from here</p>
      </div>

      <form onSubmit={handleGenerate} className="px-4 py-4 space-y-3">
        <textarea
          id="quick-generator-input"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Describe your business or enter keywords… e.g. 'AI writing tool for developers'"
          rows={3}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150 resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-600 tabular-nums">
            {keywords.length}/200
          </span>
          <button
            type="submit"
            disabled={keywords.trim().length < 3}
            className={cn(
              "inline-flex items-center gap-2 h-8 px-3 rounded-[4px] text-sm font-medium transition-colors duration-150",
              keywords.trim().length >= 3
                ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 active:scale-[0.98]"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
            )}
          >
            <Wand2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Generate
          </button>
        </div>
      </form>

      <div className="px-4 pb-4">
        <p className="text-xs text-zinc-700">
          Tip: include your target audience for better results
        </p>
      </div>
    </div>
  )
}
