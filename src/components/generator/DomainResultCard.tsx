"use client"

import { cn } from "@/lib/utils"
import { ExternalLink, Star, Eye, Copy, Check, RefreshCw, TrendingUp } from "lucide-react"
import { useState } from "react"
import type { DomainSuggestion } from "@/types/domain"
import { createClient } from "@/lib/supabase/client"

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    available: { cls: "bg-green-950 text-green-400 border-green-800", label: "Available" },
    taken:     { cls: "bg-red-950 text-red-400 border-red-800",       label: "Taken" },
    premium:   { cls: "bg-orange-950 text-orange-400 border-orange-800", label: "Premium" },
    unknown:   { cls: "bg-zinc-800 text-zinc-400 border-zinc-700",    label: "Unknown" },
    checking:  { cls: "bg-zinc-800 text-zinc-400 border-zinc-700",    label: "Checking…" },
  }
  const c = cfg[status] ?? cfg.unknown
  return (
    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-[2px] border text-xs font-medium", c.cls)}>
      {status === "checking" && <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />}
      {c.label}
    </span>
  )
}

// ─── Score bar ───────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-400" : score >= 60 ? "bg-cyan-400" : "bg-zinc-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-mono tabular-nums font-medium",
        score >= 80 ? "text-green-400" : score >= 60 ? "text-cyan-400" : "text-zinc-500"
      )}>
        {score}
      </span>
    </div>
  )
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      title="Copy domain name"
      className="h-6 w-6 flex items-center justify-center rounded-[4px] text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
    >
      {copied ? <Check className="h-3 w-3" strokeWidth={1.5} /> : <Copy className="h-3 w-3" strokeWidth={1.5} />}
    </button>
  )
}

// ─── DomainResultCard ─────────────────────────────────────────────────────────

export interface DomainResultCardProps {
  suggestion: DomainSuggestion
  isShortlisted: boolean
  onShortlist: (s: DomainSuggestion) => void
  onWatchlist: (s: DomainSuggestion) => void
  viewMode: "grid" | "list"
}

export function DomainResultCard({
  suggestion,
  isShortlisted,
  onShortlist,
  onWatchlist,
  viewMode,
}: DomainResultCardProps) {
  const [watchlisting, setWatchlisting] = useState(false)
  const [watchlisted, setWatchlisted] = useState(false)
  const [watchlistError, setWatchlistError] = useState<string | null>(null)

  const handleWatchlist = async () => {
    setWatchlisting(true)
    setWatchlistError(null)
    try {
      // Check auth client-side first
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWatchlistError("Sign in to save domains")
        return
      }

      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: suggestion.domain,
          status: suggestion.availabilityStatus,
        }),
      })

      if (res.ok) {
        setWatchlisted(true)
        onWatchlist(suggestion)
      } else {
        // Surface the real error so we can debug it
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        const msg = data.detail ?? data.error ?? `HTTP ${res.status}`
        setWatchlistError(msg)
        console.error("[Watch] API error:", msg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error"
      setWatchlistError(msg)
      console.error("[Watch] fetch failed:", msg)
    } finally {
      setWatchlisting(false)
    }
  }

  if (viewMode === "list") {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 group",
        "hover:bg-zinc-800/30 transition-colors duration-100",
      )}>
        {/* Domain */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-mono text-zinc-100 font-medium text-sm whitespace-nowrap">{suggestion.domain}</span>
          <CopyBtn text={suggestion.domain} />
          <AvailBadge status={suggestion.availabilityStatus} />
        </div>

        {/* Score */}
        <div className="w-20 hidden sm:block">
          <ScoreBar score={suggestion.score} />
        </div>

        {/* Style */}
        <span className="text-xs text-zinc-600 hidden md:block w-20 capitalize">{suggestion.style}</span>

        {/* TLD */}
        <span className="font-mono text-xs text-zinc-500 w-10 text-right">{suggestion.tld}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-wrap">
          <button
            onClick={() => onShortlist(suggestion)}
            title={isShortlisted ? "In shortlist" : "Add to shortlist"}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-[4px] transition-colors duration-150",
              isShortlisted
                ? "text-cyan-400 bg-cyan-950/50"
                : "text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800"
            )}
          >
            <Star className="h-3.5 w-3.5" strokeWidth={1.5} fill={isShortlisted ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleWatchlist}
            disabled={watchlisting || watchlisted}
            title="Add to watchlist"
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-[4px] transition-colors duration-150",
              watchlisted ? "text-green-400 bg-green-950/50" : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800",
              watchlisting && "opacity-50"
            )}
          >
            {watchlisting
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
              : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            }
          </button>
          {watchlistError && (
            <span className="text-xs text-red-400 ml-1">{watchlistError}</span>
          )}
          {suggestion.registrarLinks?.namecheap && (
            <a
              href={suggestion.registrarLinks.namecheap}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "h-7 px-2 flex items-center gap-1 rounded-[4px] text-xs font-medium transition-colors duration-150",
                suggestion.availabilityStatus === "available"
                  ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
              )}
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              {suggestion.availabilityStatus === "available" ? "Buy" : "View"}
            </a>
          )}
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className={cn(
      "bg-zinc-900 border rounded-[4px] p-4 group flex flex-col gap-3 transition-all duration-150",
      "hover:border-cyan-400/40 hover:bg-zinc-800/50",
      isShortlisted ? "border-cyan-400/30" : "border-zinc-700",
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-zinc-100 font-semibold text-base leading-tight truncate">{suggestion.domain}</span>
          <CopyBtn text={suggestion.domain} />
        </div>
        <AvailBadge status={suggestion.availabilityStatus} />
      </div>

      {/* Score */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" strokeWidth={1.5} /> AI Score
          </span>
          <span className="text-xs text-zinc-500 capitalize">{suggestion.style}</span>
        </div>
        <ScoreBar score={suggestion.score} />
      </div>

      {/* Price estimate */}
      {suggestion.priceEstimate && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-600">Est. price:</span>
          <span className="text-xs font-mono font-medium text-cyan-400/80">{suggestion.priceEstimate}</span>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
        {suggestion.explanation}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <button
          onClick={() => onShortlist(suggestion)}
          title={isShortlisted ? "In shortlist" : "Add to shortlist"}
          className={cn(
            "h-7 px-2 flex items-center gap-1.5 rounded-[4px] text-xs transition-colors duration-150",
            isShortlisted
              ? "bg-cyan-950/60 border border-cyan-800 text-cyan-400"
              : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-cyan-400 hover:border-cyan-800"
          )}
        >
          <Star className="h-3 w-3" strokeWidth={1.5} fill={isShortlisted ? "currentColor" : "none"} />
          {isShortlisted ? "Saved" : "Shortlist"}
        </button>

        <button
          onClick={handleWatchlist}
          disabled={watchlisting || watchlisted}
          title="Add to watchlist"
          className={cn(
            "h-7 px-2 flex items-center gap-1.5 rounded-[4px] text-xs bg-zinc-800 border border-zinc-700 transition-colors duration-150",
            watchlisted ? "text-green-400 border-green-800 bg-green-950/40" : "text-zinc-400 hover:text-zinc-100",
            watchlisting && "opacity-50"
          )}
        >
          {watchlisting
            ? <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />
            : <Eye className="h-3 w-3" strokeWidth={1.5} />
          }
          {watchlisted ? "Watching" : "Watch"}
        </button>
        {watchlistError && (
          <span className="text-xs text-red-400">{watchlistError}</span>
        )}

        {suggestion.registrarLinks?.namecheap && (
          <a
            href={suggestion.registrarLinks.namecheap}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "ml-auto h-7 px-2 flex items-center gap-1 rounded-[4px] text-xs font-medium transition-colors duration-150",
              suggestion.availabilityStatus === "available"
                ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
                : "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-100"
            )}
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            {suggestion.availabilityStatus === "available" ? "Buy" : "View"}
          </a>
        )}
      </div>
    </div>
  )
}
