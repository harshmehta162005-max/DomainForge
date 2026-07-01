"use client"

import { useEffect, useState, startTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCcw, AlertCircle } from "lucide-react"
import { useGenerate } from "@/hooks/use-generate"
import DomainCardStack from "@/components/domain/DomainCardStack"
import { ResultsHeader } from "@/components/domain/ResultsHeader"
import { createClient } from "@/lib/supabase/client"
import type { DomainSuggestion } from "@/types/domain"

// ─── Phase progress text ──────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  idle:       "Ready",
  generating: "Generating names…",
  checking:   "Checking availability…",
  done:       "Done",
  error:      "Something went wrong",
}

// ─── Skeleton — matches DomainCardStack card shape, zinc-800 bg ───────────────

function CardSkeleton() {
  return (
    <div className="w-80 h-96 rounded border border-zinc-800 bg-zinc-900 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-20 rounded-sm bg-zinc-800" />
        <div className="h-5 w-16 rounded-sm bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-sm bg-zinc-800" />
        <div className="h-3 w-16 rounded-sm bg-zinc-800" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <div className="h-3 w-10 rounded-sm bg-zinc-800" />
          <div className="h-3 w-6 rounded-sm bg-zinc-800" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-sm bg-zinc-800" />
        <div className="h-3 w-5/6 rounded-sm bg-zinc-800" />
        <div className="h-3 w-4/6 rounded-sm bg-zinc-800" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-16 rounded bg-zinc-800" />
        <div className="h-8 w-20 rounded bg-zinc-800" />
        <div className="h-8 w-14 ml-auto rounded bg-zinc-800" />
      </div>
    </div>
  )
}

// ─── Results Page ─────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter()
  const { phase, suggestions, error, generate, reset } = useGenerate()
  const [description, setDescription] = useState<string | null>(null)
  const [initialDomain, setInitialDomain] = useState<string | null>(null)
  const [initialSaved, setInitialSaved] = useState<string[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem("df_description")
    if (!stored) {
      router.replace("/")
      return
    }
    startTransition(() => setDescription(stored))
    generate({ businessDescription: stored })

    // Check for pending save intent
    const intentStr = sessionStorage.getItem("df_save_intent")
    if (intentStr) {
      try {
        const intent = JSON.parse(intentStr)
        setInitialDomain(intent.domain)
        setInitialSaved([intent.domain])
        
        fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            domain: intent.domain, 
            status: intent.availabilityStatus,
            score: intent.score,
            tags: [intent.style],
            price_estimate: intent.isParked ? intent.parkedPriceEstimate : intent.priceEstimate
          }),
        }).catch(console.error)
      } catch (e) {
        console.error("Failed to parse save intent", e)
      }
      sessionStorage.removeItem("df_save_intent")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRetry = () => {
    if (description) {
      reset()
      generate({ businessDescription: description })
    }
  }

  const handleBack = () => {
    reset()
    router.push("/")
  }

  const handleSave = async (suggestion: DomainSuggestion) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not signed in — store intent and redirect to auth page
      sessionStorage.setItem("df_save_intent", JSON.stringify(suggestion))
      router.push("/auth?next=/generate")
      return
    }

    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        domain: suggestion.domain, 
        status: suggestion.availabilityStatus,
        score: suggestion.score,
        tags: [suggestion.style],
        price_estimate: suggestion.isParked ? suggestion.parkedPriceEstimate : suggestion.priceEstimate
      }),
    })
    
    if (res.ok) {
      // Background fetch 3 descriptive tags for the dashboard table
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: suggestion.domain }),
      }).then(async (scoreRes) => {
        if (scoreRes.ok) {
          const { tags } = await scoreRes.json()
          if (tags && tags.length > 0) {
            await fetch("/api/watchlist", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain: suggestion.domain, tags }),
            })
          }
        }
      }).catch(() => {})
    }
  }

  const isLoading = phase === "generating" || phase === "checking"

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50">

      {/* Results Context Bar — sticky top-0, z-40 */}
      <ResultsHeader
        description={description}
        phase={phase}
        suggestions={suggestions}
        onBack={handleBack}
        onRetry={phase === "error" ? handleRetry : undefined}
      />

      {/* Main Content — fills remaining height */}
      <main className={`flex flex-col items-center justify-center flex-1 w-full ${phase === "done" && suggestions.length > 0 ? "" : "px-6 py-12"}`}>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-6">
            <CardSkeleton />
            <p className="text-sm text-zinc-500 font-mono animate-pulse">
              {PHASE_LABELS[phase]}
            </p>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Generation failed</span>
            </div>
            <p className="text-sm text-zinc-500">
              {error ?? "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
              <button
                onClick={handleBack}
                className="h-9 px-4 rounded-[4px] bg-zinc-800 text-zinc-100 border border-zinc-700 text-sm hover:bg-zinc-700 transition-colors duration-150"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {phase === "done" && suggestions.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-zinc-400 text-sm">
              No suggestions returned. Try a more detailed description.
            </p>
            <button
              onClick={handleBack}
              className="h-9 px-4 rounded-[4px] bg-zinc-800 text-zinc-100 border border-zinc-700 text-sm hover:bg-zinc-700 transition-colors duration-150"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results — DomainCardStack */}
        {phase === "done" && suggestions.length > 0 && (
          <DomainCardStack
            suggestions={suggestions}
            onSave={handleSave}
            initialDomain={initialDomain ?? undefined}
            initialSaved={initialSaved}
          />
        )}
      </main>
    </div>
  )
}
