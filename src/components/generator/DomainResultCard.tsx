"use client"

import { cn } from "@/lib/utils"
import { Share2, ExternalLink, RefreshCw, Eye, TrendingUp, Info, Star, Copy, Check } from "lucide-react"
import { RegistrarDropdown } from "@/components/domain/RegistrarDropdown"
import { useState, useEffect } from "react"
import type { DomainSuggestion } from "@/types/domain"
import { createClient } from "@/lib/supabase/client"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailBadge({ suggestion }: { suggestion: DomainSuggestion }) {
  const { availabilityStatus: status, rdapTier, isParked } = suggestion
  const cfg: Record<string, { cls: string; label: string }> = {
    available: { cls: "bg-green-950 text-green-400 border-green-800", label: "Available" },
    taken:     { cls: "bg-red-950 text-red-400 border-red-800",       label: "Taken" },
    premium:   { cls: "bg-orange-950 text-orange-400 border-orange-800", label: "Premium" },
    parked:    { cls: "bg-amber-950 text-amber-400 border-amber-800", label: "Parked" },
    unverified:{ cls: "bg-yellow-950 text-yellow-400 border-yellow-800", label: "Unverified" },
    unknown:   { cls: "bg-zinc-800 text-zinc-400 border-zinc-700",    label: "Unknown" },
    checking:  { cls: "bg-zinc-800 text-zinc-400 border-zinc-700",    label: "Checking…" },
  }
  const c = cfg[status] ?? cfg.unknown
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-[2px] border text-[10px] uppercase tracking-wider font-medium", c.cls)}>
        {status === "checking" && <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />}
        {c.label}
      </span>
      {status !== "checking" && rdapTier === "tier2" && (
        <span className="text-[10px] text-zinc-500 hidden sm:inline" title="Verified via registry">Registry Verified</span>
      )}
      {status !== "checking" && rdapTier === "tier3" && (
        <span className="text-[10px] text-yellow-500 hidden sm:inline" title="Confirm manually on registry">Confirm on registry</span>
      )}
    </div>
  )
}

// ─── Score bar ───────────────────────────────────────────────────────────────

function ScoreIndicator({ score, scoreBreakdown }: { score: number, scoreBreakdown?: DomainSuggestion["scoreBreakdown"] }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-cyan-500" : "bg-zinc-500"
  
  const indicator = (
    <div className="relative flex items-center gap-2">
      <div className="h-1.5 w-16 sm:w-24 bg-zinc-800 rounded-full overflow-hidden">
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

  if (!scoreBreakdown) return indicator

  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger>
          <div className="cursor-default">{indicator}</div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="w-56 p-3 bg-zinc-800 border-zinc-700 text-xs shadow-xl rounded-md z-[60]">
          <div className="space-y-1.5 w-full">
            <div className="flex justify-between"><span className="text-zinc-400">Brandability</span><span className="text-zinc-200 font-mono">{scoreBreakdown.brandability}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Typeability</span><span className="text-zinc-200 font-mono">{scoreBreakdown.typeability}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Relevance</span><span className="text-zinc-200 font-mono">{scoreBreakdown.keywordRelevance}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">TLD Trust</span><span className="text-zinc-200 font-mono">{scoreBreakdown.tldTrust}</span></div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

// ─── Social Handles ──────────────────────────────────────────────────────────

function SocialHandlesInline({ suggestion }: { suggestion: DomainSuggestion }) {
  const [handles, setHandles] = useState(suggestion.socialHandles)
  const [loading, setLoading] = useState(!suggestion.socialHandles)
  
  useEffect(() => {
    if (handles) return
    let mounted = true
    fetch('/api/social-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: suggestion.domain, baseName: suggestion.baseName })
    }).then(r => r.json()).then(data => {
      if (mounted && data.twitter) {
        setHandles(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [suggestion, handles])

  if (loading) {
    return <div className="text-[10px] text-zinc-600 animate-pulse mt-2 pt-2 border-t border-zinc-800/60">Checking socials...</div>
  }
  if (!handles) return null

  const twColor = handles.twitter?.status === "available" ? "text-green-400" : handles.twitter?.status === "taken" ? "text-red-400" : "text-zinc-500"
  const igColor = handles.instagram?.status === "available" ? "text-green-400" : handles.instagram?.status === "taken" ? "text-red-400" : "text-zinc-500"

  return (
    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-zinc-800/60">
      <span className="text-[10px] text-zinc-500 cursor-help" title="Exact-match availability can't be guaranteed across all platforms (best effort).">Socials:</span>
      <div className="flex items-center gap-1 cursor-help" title={`X (Twitter): ${handles.twitter?.status}`}>
        <span className={cn("font-bold", twColor)}>X</span>
        <span className={cn("text-[10px]", twColor)}>{handles.twitter?.status === "available" ? "✓" : handles.twitter?.status === "taken" ? "×" : "?"}</span>
      </div>
      <div className="flex items-center gap-1 cursor-help" title={`Instagram: ${handles.instagram?.status}`}>
        <span className={cn("font-bold", igColor)}>IG</span>
        <span className={cn("text-[10px]", igColor)}>{handles.instagram?.status === "available" ? "✓" : handles.instagram?.status === "taken" ? "×" : "?"}</span>
      </div>
    </div>
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
          score: suggestion.score,
          tags: [suggestion.style],
          price_estimate: suggestion.isParked ? suggestion.parkedPriceEstimate : suggestion.priceEstimate
        }),
      })

      if (res.ok) {
        setWatchlisted(true)
        onWatchlist(suggestion)
        
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
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        const msg = data.detail ?? data.error ?? `HTTP ${res.status}`
        setWatchlistError(msg)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error"
      setWatchlistError(msg)
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
          <AvailBadge suggestion={suggestion} />
        </div>

        <div className="w-32 hidden sm:block">
          <ScoreIndicator score={suggestion.score} scoreBreakdown={suggestion.scoreBreakdown} />
        </div>

        {/* Style */}
        <span className="text-xs text-zinc-600 hidden md:block w-20 capitalize">{suggestion.style}</span>

        {/* TLD */}
        <span className="font-mono text-xs text-zinc-500 w-10 text-right">{suggestion.tld}</span>

        {/* Actions */}
        <div className="w-[120px] flex items-center justify-center gap-1 flex-wrap">
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
          <RegistrarDropdown
            suggestion={suggestion}
            className="ml-auto"
            variant="secondary"
          />
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
        <AvailBadge suggestion={suggestion} />
      </div>

      {/* Score & Style */}
      <div className="space-y-1 mt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" strokeWidth={1.5} /> AI Score
          </span>
          <span className="text-xs text-zinc-500 capitalize">{suggestion.style}</span>
        </div>
        <ScoreIndicator score={suggestion.score} scoreBreakdown={suggestion.scoreBreakdown} />
      </div>

      {/* Price estimate for parked or premium/normal */}
      {suggestion.isParked ? (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-amber-500">Parked estimate:</span>
          <span className="text-xs font-mono font-medium text-amber-400/80">{suggestion.parkedPriceEstimate || "Unknown"}</span>
        </div>
      ) : suggestion.priceEstimate ? (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-zinc-600">Est. price:</span>
          <span className="text-xs font-mono font-medium text-cyan-400/80">{suggestion.priceEstimate}</span>
        </div>
      ) : null}

      {/* Explanation */}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mt-1">
        {suggestion.explanation}
      </p>

      {/* Social Handles */}
      <SocialHandlesInline suggestion={suggestion} />

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-auto pt-2">
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

        <RegistrarDropdown
          suggestion={suggestion}
          className="ml-auto"
          variant="secondary"
        />
      </div>
    </div>
  )
}
