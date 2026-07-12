"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ExternalLink, Eye, Bookmark, Wand2, Download, X, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistPreviewItem {
  id: string
  domain: string
  status: string
  score: number
}

interface RecentGeneration {
  id: string
  domain: string
  ts: string
}

interface DomainActivityPanelProps {
  watchlistPreview: WatchlistPreviewItem[]
  recentGenerations: RecentGeneration[]
  plan: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "just now"
  if (h < 1) return `${m}m ago`
  if (d < 1) return `${h}h ago`
  return `${d}d ago`
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "available"
      ? "bg-green-400"
      : status === "taken"
        ? "bg-red-400"
        : "bg-zinc-600"
  return <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", color)} />
}

// ─── Generated History Dialog ─────────────────────────────────────────────────

interface GeneratedDomain {
  id: string
  domain: string
  created_at: string
}

function GeneratedHistoryDialog({ onClose }: { onClose: () => void }) {
  const [domains, setDomains] = useState<GeneratedDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch on first render
  const fetchRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    fetch("/api/profile/generated-history")
      .then((r) => r.json())
      .then((data: { domains?: GeneratedDomain[]; error?: string }) => {
        if (data.error) {
          setError(data.error)
        } else {
          setDomains(data.domains ?? [])
        }
      })
      .catch(() => setError("Failed to load history"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={fetchRef}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[6px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-100">Generated Domains</h3>
            {!loading && (
              <span className="text-xs text-zinc-600 font-mono">({domains.length})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="px-5 py-8 text-center text-sm text-red-400">{error}</div>
          )}

          {!loading && !error && domains.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Wand2 className="h-8 w-8 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm text-zinc-500 mb-1">No generated domains yet</p>
              <p className="text-xs text-zinc-700">Run a generation to see results here</p>
              <Link
                href="/generator"
                onClick={onClose}
                className="mt-4 inline-flex items-center h-8 px-3 text-xs rounded-[4px] bg-cyan-400 text-zinc-950 font-medium hover:bg-cyan-300 transition-colors"
              >
                Go to generator →
              </Link>
            </div>
          )}

          {!loading && !error && domains.length > 0 && (
            <div className="divide-y divide-zinc-800/60">
              {domains.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors duration-100 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Wand2 className="h-3 w-3 text-zinc-600 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-mono text-sm text-zinc-200 truncate">{d.domain}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                      <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
                      {timeAgo(d.created_at)}
                    </span>
                    <a
                      href={`https://www.namecheap.com/domains/registration/results/?domain=${d.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 h-6 px-2 rounded-[3px] bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition-all duration-150"
                    >
                      <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
                      Check
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && domains.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-600">Newest first · last 200 sessions</span>
            <Link
              href="/generator"
              onClick={onClose}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Generate more →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DomainActivityPanel ──────────────────────────────────────────────────────

export function DomainActivityPanel({
  watchlistPreview,
  recentGenerations,
  plan,
}: DomainActivityPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        {/* Recent Watchlist */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-zinc-200">Recent Watchlist</h3>
            </div>
            <Link
              href="/dashboard/watchlist"
              className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors duration-150"
            >
              View all →
            </Link>
          </div>

          {watchlistPreview.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <Eye className="h-6 w-6 text-zinc-700 mx-auto mb-2" strokeWidth={1} />
              <p className="text-xs text-zinc-600">No domains in watchlist yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {watchlistPreview.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 group hover:bg-zinc-800/30 transition-colors duration-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StatusDot status={item.status} />
                    <span className="font-mono text-sm text-zinc-200 truncate">{item.domain}</span>
                    <span className="text-xs text-zinc-600 capitalize flex-shrink-0">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono text-zinc-500">
                      Score <span className="text-zinc-300">{item.score}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Generated */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-zinc-200">Recently Generated</h3>
            </div>
            {/* "View all" opens the dialog */}
            <button
              onClick={() => setDialogOpen(true)}
              className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors duration-150"
            >
              View all →
            </button>
          </div>

          {recentGenerations.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <Wand2 className="h-6 w-6 text-zinc-700 mx-auto mb-2" strokeWidth={1} />
              <p className="text-xs text-zinc-600 mb-2">No generated domains yet</p>
              <Link
                href="/generator"
                className="inline-flex items-center h-7 px-3 text-xs rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Try the generator →
              </Link>
            </div>
          ) : (
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {recentGenerations.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center h-7 px-2.5 rounded-[3px] bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors cursor-default"
                    title={timeAgo(g.ts)}
                  >
                    {g.domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/shortlist"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[4px] bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors duration-150"
          >
            <Bookmark className="h-3 w-3" strokeWidth={1.5} />
            View Shortlist
          </Link>
          <a
            href={plan === "pro" ? "/api/export-account" : "/dashboard/billing"}
            className={cn(
              "inline-flex items-center gap-2 h-8 px-3 rounded-[4px] border text-xs transition-colors duration-150",
              plan === "pro"
                ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                : "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            <Download className="h-3 w-3" strokeWidth={1.5} />
            Export account {plan !== "pro" && <span className="text-amber-500 font-mono">(Pro)</span>}
          </a>
        </div>
      </div>

      {/* Generated history dialog */}
      {dialogOpen && <GeneratedHistoryDialog onClose={() => setDialogOpen(false)} />}
    </>
  )
}
