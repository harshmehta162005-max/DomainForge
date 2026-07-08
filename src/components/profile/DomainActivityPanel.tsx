import Link from "next/link"
import { ExternalLink, Eye, Bookmark, Wand2, Download } from "lucide-react"
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const color =
    status === "available"
      ? "bg-green-400"
      : status === "taken"
      ? "bg-red-400"
      : "bg-zinc-600"
  return <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", color)} />
}

// ─── DomainActivityPanel ──────────────────────────────────────────────────────

export function DomainActivityPanel({
  watchlistPreview,
  recentGenerations,
  plan,
}: DomainActivityPanelProps) {
  return (
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
                  {item.status === "available" && (
                    <a
                      href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-[3px] bg-cyan-400 text-zinc-950 text-[10px] font-medium hover:bg-cyan-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
                      Register
                    </a>
                  )}
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
          <Link
            href="/dashboard/history"
            className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors duration-150"
          >
            View history →
          </Link>
        </div>

        {recentGenerations.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <Wand2 className="h-6 w-6 text-zinc-700 mx-auto mb-2" strokeWidth={1} />
            <p className="text-xs text-zinc-600">No generated domains yet</p>
            <Link
              href="/generator"
              className="mt-2 inline-flex items-center h-7 px-3 text-xs rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
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
                  className="inline-flex items-center h-7 px-2.5 rounded-[3px] bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300"
                >
                  {g.domain}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shortlist quick-link */}
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
  )
}
