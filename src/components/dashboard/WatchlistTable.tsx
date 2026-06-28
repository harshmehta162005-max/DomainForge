"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ExternalLink,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AtSign,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Bell,
  BellOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WatchlistItem } from "@/types/dashboard"

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    available: { bg: "bg-green-950", text: "text-green-400", border: "border-green-800", label: "Available" },
    taken:     { bg: "bg-red-950",   text: "text-red-400",   border: "border-red-800",   label: "Taken" },
    premium:   { bg: "bg-orange-950",text: "text-orange-400",border: "border-orange-800",label: "Premium" },
    unknown:   { bg: "bg-zinc-800",  text: "text-zinc-400",  border: "border-zinc-700",  label: "Unknown" },
    checking:  { bg: "bg-zinc-800",  text: "text-zinc-400",  border: "border-zinc-700",  label: "Checking…" },
  }
  const c = config[status] ?? config.unknown
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-xs font-medium",
      c.bg, c.text, c.border
    )}>
      {status === "checking" && (
        <RefreshCw className="h-2.5 w-2.5 animate-spin" strokeWidth={2} />
      )}
      {c.label}
    </span>
  )
}

// ─── Score Cell ───────────────────────────────────────────────────────────────

function ScoreCell({ score }: { score: number }) {
  const color =
    score >= 90 ? "text-green-400" :
    score >= 80 ? "text-cyan-400" :
    score >= 70 ? "text-yellow-400" :
    "text-zinc-400"
  return (
    <span className={cn("text-sm font-mono font-medium tabular-nums", color)}>
      {score}
    </span>
  )
}

// ─── Social Cell ──────────────────────────────────────────────────────────────

function SocialCell({ handle, available, Icon }: {
  handle: string | null
  available: boolean | null
  Icon: React.ElementType
}) {
  if (!handle) return <span className="text-zinc-700">—</span>
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-mono",
      available === true ? "text-green-400" :
      available === false ? "text-red-400" :
      "text-zinc-500"
    )}>
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      @{handle}
    </span>
  )
}

// ─── Price Sparkline ──────────────────────────────────────────────────────────

function PriceSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 40
  const h = 16
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(" ")
  const isUp = data[data.length - 1] >= data[0]
  return (
    <svg width={w} height={h} className="inline-block ml-1">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#4ade80" : "#f87171"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Copy Domain ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])
  return (
    <button
      onClick={handleCopy}
      title="Copy domain"
      className="h-5 w-5 flex items-center justify-center rounded-[2px] text-zinc-600 hover:text-zinc-300 transition-colors duration-100"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.5} />
      )}
    </button>
  )
}

// ─── Expiry Cell ──────────────────────────────────────────────────────────────

function ExpiryCell({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span className="text-zinc-700 text-xs">—</span>
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  const color = days <= 7 ? "text-red-400" : days <= 14 ? "text-orange-400" : "text-zinc-400"
  return (
    <span className={cn("text-xs tabular-nums font-mono", color)}>
      {days}d
    </span>
  )
}

// ─── Tag Chips ────────────────────────────────────────────────────────────────

function TagChips({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map(tag => (
        <span
          key={tag}
          className="px-1.5 py-0.5 rounded-[2px] bg-cyan-950 border border-cyan-900 text-cyan-400 text-xs font-mono"
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-xs text-zinc-600">+{tags.length - 3}</span>
      )}
    </div>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-zinc-800 rounded-[2px] animate-skeleton" style={{ width: `${40 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyTable() {
  return (
    <tr>
      <td colSpan={9} className="px-4 py-16 text-center">
        <p className="text-sm text-zinc-500 mb-4">
          No domains saved yet. Generate some names to get started.
        </p>
        <a
          href="/"
          className="inline-flex items-center h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
        >
          Generate names →
        </a>
      </td>
    </tr>
  )
}

type SortField = "domain" | "score" | "status" | "createdAt"
type SortDir = "asc" | "desc"

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField
  sortField: SortField
  sortDir: SortDir
}) {
  if (sortField !== field) return null
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 ml-1 inline text-cyan-400" />
    : <ChevronDown className="h-3 w-3 ml-1 inline text-cyan-400" />
}

// ─── Col Header ───────────────────────────────────────────────────────────────

function ColHeader({
  field,
  sortField,
  sortDir,
  onSort,
  children,
  className,
}: {
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors duration-100 select-none whitespace-nowrap",
        className
      )}
      onClick={() => onSort(field)}
    >
      {children}
      <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  )
}

// ─── WatchlistTable ───────────────────────────────────────────────────────────

// ─── Action Buttons ───────────────────────────────────────────────────────────────

function CheckButton({ domain, onStatusChange }: {
  domain: string
  onStatusChange?: (domain: string, status: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: [domain] }), // API expects { domains: string[] }
      })
      if (res.ok) {
        const data = await res.json() as { results?: Record<string, { status: string }> }
        const status = data.results?.[domain]?.status ?? "unknown"
        if (onStatusChange) {
          onStatusChange(domain, status)
        }
        router.refresh()
      }
    } catch {
      // silently fail — status stays unchanged
    } finally {
      setLoading(false)
    }
  }


  return (
    <button
      onClick={handleCheck}
      disabled={loading}
      className="h-7 px-2 rounded-[4px] text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-100 whitespace-nowrap disabled:opacity-50"
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin inline" />
      ) : "Check"}
    </button>
  )
}

function AlertButton({ domain, alertEnabled }: {
  domain: string
  alertEnabled: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleAlert = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, alert_enabled: !alertEnabled }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleAlert}
      disabled={loading}
      title={alertEnabled ? "Disable email alerts" : "Enable email alerts"}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-[4px] transition-colors duration-100 disabled:opacity-50",
        alertEnabled ? "text-cyan-400 hover:bg-zinc-700" : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700"
      )}
    >
      {loading ? (
        <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />
      ) : alertEnabled ? (
        <Bell className="h-3 w-3" strokeWidth={1.5} />
      ) : (
        <BellOff className="h-3 w-3" strokeWidth={1.5} />
      )}
    </button>
  )
}

function RemoveButton({ domain, onRemove }: {
  domain: string
  onRemove?: (domain: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      if (res.ok) {
        if (onRemove) {
          onRemove(domain)
        }
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Remove from watchlist"
      className="h-7 w-7 flex items-center justify-center rounded-[4px] text-zinc-600 hover:text-red-400 hover:bg-zinc-700 transition-colors duration-100 disabled:opacity-50"
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
      ) : (
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
    </button>
  )
}

type WatchlistTableProps = {
  items: WatchlistItem[]
  isLoading?: boolean
}

export function WatchlistTable({ items, isLoading = false }: WatchlistTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Filter + sort
  const filtered = items
    .filter(item => {
      if (search && !item.domain.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === "domain") cmp = a.domain.localeCompare(b.domain)
      else if (sortField === "score") cmp = a.score - b.score
      else if (sortField === "status") cmp = a.status.localeCompare(b.status)
      else if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(i => i.id)))
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-zinc-800">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter domains…"
            className="w-full h-8 pl-8 pr-3 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-8 px-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="taken">Taken</option>
            <option value="premium">Premium</option>
            <option value="checking">Checking</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-[4px] border border-zinc-700">
            <span className="text-xs text-zinc-400">{selected.size} selected</span>
            <button className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Export</button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-[4px] transition-colors duration-100",
              viewMode === "table" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <List className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-[4px] transition-colors duration-100",
              viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Table view */}
      {viewMode === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="w-8 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                  />
                </th>
                <ColHeader field="domain" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Domain</ColHeader>
                <ColHeader field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Status</ColHeader>
                <ColHeader field="score" sortField={sortField} sortDir={sortDir} onSort={handleSort}>Score</ColHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                <ColHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell">Saved</ColHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Social</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {!isLoading && filtered.length === 0 && <EmptyTable />}
              {!isLoading && filtered.map(item => (
                <tr
                  key={item.id}
                  className={cn(
                    "group transition-colors duration-100 hover:bg-zinc-800/40",
                    selected.has(item.id) && "bg-zinc-800/30"
                  )}
                >
                  {/* Checkbox */}
                  <td className="w-8 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                    />
                  </td>

                  {/* Domain */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-zinc-100 font-medium text-sm whitespace-nowrap" data-domain>
                        {item.domain}
                      </span>
                      <CopyButton text={item.domain} />
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-all duration-150"
                      >
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                      </a>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3">
                    <ScoreCell score={item.score} />
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3">
                    <TagChips tags={item.tags} />
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                    <span className="text-xs text-zinc-500 line-clamp-1">
                      {item.notes ?? "—"}
                    </span>
                  </td>

                  {/* Saved */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Expires In */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <ExpiryCell expiresAt={item.expiresAt} />
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-300 font-mono whitespace-nowrap">
                        {item.priceEstimate ?? "—"}
                      </span>
                      {item.priceHistory.length >= 2 && (
                        <PriceSparkline data={item.priceHistory} />
                      )}
                    </div>
                  </td>

                  {/* Social */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-col gap-1">
                      <SocialCell handle={item.socialX} available={item.socialXAvailable} Icon={AtSign} />
                      <SocialCell handle={item.socialIg} available={item.socialIgAvailable} Icon={AtSign} />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <CheckButton domain={item.domain} />
                      {item.status === "available" && (
                        <a
                          href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 px-2 rounded-[4px] flex items-center justify-center text-xs text-cyan-400 hover:text-cyan-300 hover:bg-zinc-700 transition-colors duration-100 whitespace-nowrap"
                        >
                          Buy
                        </a>
                      )}
                      <AlertButton domain={item.domain} alertEnabled={item.alert_enabled} />
                      <RemoveButton domain={item.domain} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid / Portfolio view */}
      {viewMode === "grid" && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(item => (
            <div
              key={item.id}
              className="border border-zinc-700 rounded-[4px] p-4 hover:border-cyan-400/40 hover:bg-zinc-800/30 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-zinc-100 font-medium text-sm" data-domain>
                  {item.domain}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <ScoreCell score={item.score} />
                <span className="text-xs text-zinc-600">/ 100</span>
                <span className="ml-auto text-xs text-zinc-300 font-mono">{item.priceEstimate ?? "—"}</span>
              </div>
              <TagChips tags={item.tags} />
              {item.notes && (
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{item.notes}</p>
              )}
              <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <CheckButton domain={item.domain} />
                {item.status === "available" && (
                  <a
                    href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors ml-2"
                  >
                    Buy →
                  </a>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <AlertButton domain={item.domain} alertEnabled={item.alert_enabled} />
                  <RemoveButton domain={item.domain} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer: count */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/30">
        <p className="text-xs text-zinc-600">
          {filtered.length} of {items.length} domain{items.length !== 1 ? "s" : ""}
          {search || statusFilter !== "all" ? " (filtered)" : ""}
        </p>
      </div>
    </div>
  )
}
