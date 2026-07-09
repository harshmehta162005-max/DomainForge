"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Info,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WatchlistItem } from "@/types/dashboard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProUpgradeDialog } from "@/components/ui/ProUpgradeDialog"

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
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold tracking-wide shadow-sm transition-transform hover:scale-105",
      c.bg, c.text, c.border
    )}>
      {status === "checking" && (
        <RefreshCw className="h-3 w-3 animate-spin" strokeWidth={2.5} />
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

function SocialCell({ handle, available, label }: {
  handle: string | null
  available: boolean | null
  label: string
}) {
  if (handle === null || available === null) {
    return (
      <span className="flex items-center gap-1.5 text-zinc-700 text-xs font-mono">
        <span className="w-4 text-center font-bold text-[10px] opacity-50">{label}</span>
        —
      </span>
    )
  }
  
  const displayHandle = handle.startsWith("@") ? handle : `@${handle}`
  
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-mono",
        available === true ? "text-green-400" :
        available === false ? "text-red-400" :
        "text-zinc-500"
      )}
      title={displayHandle}
    >
      <span className={cn(
        "w-4 text-center font-bold text-[10px]",
        available === true ? "text-green-500" :
        available === false ? "text-red-500" :
        "text-zinc-400"
      )}>{label}</span>
      <span className="truncate max-w-[100px]">{displayHandle}</span>
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
      className="h-6 w-6 flex items-center justify-center rounded-md bg-zinc-800/40 border border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 transition-all duration-200 active:scale-90"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
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
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map(tag => (
        <span
          key={tag}
          className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-medium tracking-wide shadow-sm transition-colors hover:bg-cyan-500/20"
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
        <td key={i} className="px-4 py-4">
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
          href="/generator"
          className="inline-flex items-center h-9 px-5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95"
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
        "px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-200 transition-colors duration-100 select-none whitespace-nowrap",
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

function CheckButton({ domain, onUpdate }: {
  domain: string
  onUpdate?: (domain: string, updates: Partial<WatchlistItem>) => void
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [checked, setChecked] = useState(false)

  const handleCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: [domain], forceRefresh: true }),
      })
      if (res.ok) {
        const data = await res.json() as { results?: Record<string, { status: string; expiresAt?: string }> }
        const status = (data.results?.[domain]?.status ?? "unknown") as WatchlistItem["status"]
        const expiresAt = data.results?.[domain]?.expiresAt
        
        if (onUpdate) {
          onUpdate(domain, { status, expiresAt: expiresAt || null })
        }
        
        await fetch("/api/watchlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            domain, 
            status: status,
            ...(expiresAt ? { expires_at: expiresAt } : {})
          }),
        })
        setChecked(true)
        router.refresh()
      }
    } catch {
      // silently fail — status stays unchanged
    } finally {
      setLoading(false)
    }
  }

  if (checked) {
    return <span className="text-zinc-700 text-xs">—</span>
  }

  return (
    <button
      onClick={handleCheck}
      disabled={loading}
      className="h-7 px-3 flex items-center justify-center rounded-md text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 whitespace-nowrap disabled:opacity-50 hover:shadow-md active:scale-95"
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin inline" />
      ) : "Check"}
    </button>
  )
}

function AlertButton({ item }: {
  item: WatchlistItem
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [proDialogOpen, setProDialogOpen] = useState(false)
  const router = useRouter()

  const [frequency, setFrequency] = useState(item.notify_frequency)
  const [prefs, setPrefs] = useState(item.notification_preferences)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          domain: item.domain, 
          alert_enabled: true,
          notify_frequency: frequency,
          notification_preferences: prefs
        }),
      })
      if (res.status === 403) {
        setOpen(false)
        setProDialogOpen(true)
        return
      }
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = async () => {
    // If it's disabled, clicking the bell opens the settings to enable it.
    if (!item.alert_enabled) {
      setOpen(true)
      return
    }
    // If it's enabled, clicking the bell disables it.
    setLoading(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: item.domain, alert_enabled: false }),
      })
      if (res.status === 403) {
        setProDialogOpen(true)
        return
      }
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleAlert}
          disabled={loading}
          title={item.alert_enabled ? "Disable email alerts" : "Enable email alerts"}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-all duration-200 disabled:opacity-50 active:scale-95 border",
            item.alert_enabled ? "text-cyan-400 bg-cyan-950/20 border-cyan-900/30 hover:bg-cyan-900/40 hover:border-cyan-800" : "text-zinc-500 bg-zinc-800/30 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600"
          )}
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
          ) : item.alert_enabled ? (
            <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <BellOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </button>
        {item.alert_enabled && (
          <button
            onClick={() => setOpen(true)}
            title="Notification Settings"
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all duration-200 active:scale-95"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl p-0 overflow-hidden sm:rounded-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl text-zinc-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-400" />
              Alert Settings for <span className="text-cyan-400">{item.domain}</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2 text-[15px]">
              Configure when and how often you want to be notified about changes to this domain.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-300">Notify me about:</h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={prefs.availability}
                  onChange={(e) => setPrefs({...prefs, availability: e.target.checked})}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-cyan-500" 
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Domain becomes Available</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={prefs.price_drop}
                  onChange={(e) => setPrefs({...prefs, price_drop: e.target.checked})}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-cyan-500" 
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Price Drops</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={prefs.expiration}
                  onChange={(e) => setPrefs({...prefs, expiration: e.target.checked})}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 accent-cyan-500" 
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Upcoming Expirations (30, 15, 7, 3 days)</span>
              </label>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Frequency:</h3>
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                <option value="immediate">Immediate (As soon as detected)</option>
                <option value="daily">Daily Digest Max (Once a day)</option>
                <option value="weekly">Weekly Digest Max (Once a week)</option>
              </select>
            </div>
          </div>
          <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 p-6 sm:justify-end gap-3">
            <button
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-md text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-10 px-4 rounded-md text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-2 min-w-[100px] justify-center"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save Settings"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProUpgradeDialog
        open={proDialogOpen}
        onOpenChange={setProDialogOpen}
        featureName="Domain availability alerts"
      />
    </>
  )
}

function RemoveButton({ onClick }: {
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title="Remove from watchlist"
      className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 bg-zinc-800/30 border border-zinc-800 hover:border-red-900/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
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
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<WatchlistItem>>>({})

  const handleUpdateItem = (domain: string, updates: Partial<WatchlistItem>) => {
    setLocalUpdates(prev => ({
      ...prev,
      [domain]: { ...prev[domain], ...updates }
    }))
  }

  // Filter + sort
  const displayItems = items.map(item => ({ ...item, ...localUpdates[item.domain] }))

  const filtered = displayItems
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

  const [deleteTarget, setDeleteTarget] = useState<string | "bulk" | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleBulkRemoveClick = () => {
    setDeleteTarget("bulk")
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget === "bulk") {
        const domainsToRemove = filtered.filter(i => selected.has(i.id)).map(i => i.domain)
        await Promise.all(domainsToRemove.map(domain => 
          fetch("/api/watchlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          })
        ))
        setSelected(new Set())
      } else {
        await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: deleteTarget }),
        })
      }
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkExport = () => {
    const selectedItems = filtered.filter(i => selected.has(i.id))
    const headers = ["Domain", "Status", "Score", "Tags", "Notes", "Price Estimate", "Expires At", "X (Twitter)", "Instagram"]
    const csvRows = [headers.join(",")]
    
    for (const item of selectedItems) {
      const row = [
        item.domain,
        item.status,
        item.score.toString(),
        `"${item.tags.join("; ")}"`,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
        `"${item.priceEstimate || ""}"`,
        item.expiresAt || "",
        item.socialX || "",
        item.socialIg || ""
      ]
      csvRows.push(row.join(","))
    }
    
    const blob = new Blob([csvRows.join("\\n")], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `domainforge_watchlist_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const router = useRouter()
  const [checkingSocials, setCheckingSocials] = useState<Record<string, boolean>>({})

  const handleSingleSocialCheck = async (domain: string) => {
    setCheckingSocials(prev => ({ ...prev, [domain]: true }))
    try {
      const baseName = domain.split(".")[0]
      const res = await fetch("/api/social-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, baseName }),
      })
      if (res.ok) {
        const data = await res.json()
        const social_x = data.twitter?.handle ?? null
        const social_x_available = data.twitter?.status === "unknown" ? null : data.twitter?.status === "available"
        const social_ig = data.instagram?.handle ?? null
        const social_ig_available = data.instagram?.status === "unknown" ? null : data.instagram?.status === "available"

        handleUpdateItem(domain, {
          socialX: social_x,
          socialXAvailable: social_x_available,
          socialIg: social_ig,
          socialIgAvailable: social_ig_available,
        })

        await fetch("/api/watchlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain,
            social_x,
            social_x_available,
            social_ig,
            social_ig_available,
          }),
        })
        router.refresh()
      }
    } finally {
      setCheckingSocials(prev => ({ ...prev, [domain]: false }))
    }
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
            className="filter-select h-8 pl-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="taken">Taken</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-[4px] border border-zinc-700">
            <span className="text-xs text-zinc-400">{selected.size} selected</span>
            <button 
              onClick={handleBulkRemoveClick}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              Remove
            </button>
            <button 
              onClick={handleBulkExport}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Export
            </button>
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
              <tr className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <th className="w-8 px-4 py-4">
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
                <th className="px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Tags</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                <ColHeader field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell">Saved</ColHeader>
                <th className="px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Expires</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden xl:table-cell">Price</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden xl:table-cell">Social</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
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
                    "group transition-all duration-300 hover:bg-zinc-800/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),inset_0_-1px_0_rgba(255,255,255,0.03)]",
                    selected.has(item.id) && "bg-zinc-800/40"
                  )}
                >
                  {/* Checkbox */}
                  <td className="w-8 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                    />
                  </td>

                  {/* Domain */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Link 
                        href={`/domain/${item.domain}`} 
                        className="font-mono text-zinc-100 font-medium text-sm whitespace-nowrap hover:text-cyan-400 hover:underline transition-colors flex items-center gap-1.5 group/link"
                        title="View domain details & trademark risk"
                      >
                        {item.domain}
                        <Info className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                      <CopyButton text={item.domain} />
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    {item.status === "available" ? (
                      <a
                        href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        title="Register this domain"
                      >
                        <StatusBadge status={item.status} />
                      </a>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </td>

                  {/* Score */}
                  <td className="px-4 py-4">
                    <ScoreCell score={item.score} />
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-4">
                    <TagChips tags={item.tags} />
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                    <input
                      type="text"
                      defaultValue={item.notes ?? ""}
                      placeholder="Add note..."
                      className="w-full bg-transparent border-none outline-none text-xs text-zinc-500 placeholder:text-zinc-700 focus:text-zinc-300 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={async (e) => {
                        const val = e.target.value.trim()
                        const newNote = val === "" ? null : val
                        if (newNote !== item.notes) {
                          await fetch("/api/watchlist", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ domain: item.domain, notes: newNote }),
                          })
                        }
                      }}
                    />
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
                    {item.status === "available" ? (
                      <span className="text-zinc-700 text-xs">—</span>
                    ) : item.expiresAt ? (
                      <ExpiryCell expiresAt={item.expiresAt} />
                    ) : (
                      <CheckButton domain={item.domain} onUpdate={handleUpdateItem} />
                    )}
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
                    {item.socialX === null && item.socialIg === null ? (
                      <button
                        onClick={() => handleSingleSocialCheck(item.domain)}
                        disabled={checkingSocials[item.domain]}
                        className="h-7 px-3 text-[10px] uppercase tracking-wider font-bold text-zinc-400 hover:text-cyan-300 transition-all duration-200 bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-900/50 hover:bg-cyan-950/30 rounded-md flex items-center justify-center min-w-[64px] disabled:opacity-50 active:scale-95 shadow-sm"
                      >
                        {checkingSocials[item.domain] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "CHECK"}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                        <SocialCell handle={item.socialX} available={item.socialXAvailable} label="X" />
                        <SocialCell handle={item.socialIg} available={item.socialIgAvailable} label="IG" />
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5 transition-opacity duration-150 min-w-[140px] mx-auto">
                      <div className="min-w-[56px] flex justify-center">
                        {item.status === "available" ? (
                          <a
                            href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 px-3 rounded-md flex items-center justify-center text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-all duration-200 whitespace-nowrap hover:shadow-[0_0_12px_rgba(34,211,238,0.15)] active:scale-95"
                          >
                            Buy
                          </a>
                        ) : (
                          <a
                            href={`http://${item.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 px-3 rounded-md flex items-center justify-center text-xs font-semibold bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all duration-200 whitespace-nowrap active:scale-95"
                          >
                            View
                          </a>
                        )}
                      </div>
                      <AlertButton item={item} />
                      <RemoveButton onClick={() => setDeleteTarget(item.domain)} />
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
              className="border border-zinc-700 rounded-[4px] p-5 min-h-[220px] hover:border-cyan-400/40 hover:bg-zinc-800/30 transition-all duration-150 group flex flex-col h-full gap-3"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-zinc-100 font-medium text-sm" data-domain>
                  {item.domain}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-2">
                <ScoreCell score={item.score} />
                <span className="text-xs text-zinc-600">/ 100</span>
                <span className="ml-auto text-xs text-zinc-300 font-mono">{item.priceEstimate ?? "—"}</span>
              </div>
              <TagChips tags={item.tags} />
              {item.notes && (
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-400 line-clamp-3">{item.notes}</p>
              )}
              
              <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.status === "available" ? (
                    <a
                      href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-4 rounded-md flex items-center justify-center text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 transition-all duration-200 active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                    >
                      Buy →
                    </a>
                  ) : (
                    <a
                      href={`http://${item.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-4 rounded-md flex items-center justify-center text-xs font-semibold bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200 transition-all duration-200 active:scale-95"
                    >
                      View →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <AlertButton item={item} />
                  <RemoveButton onClick={() => setDeleteTarget(item.domain)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl p-0 overflow-hidden sm:rounded-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl text-zinc-100">
              Remove Domain{deleteTarget === "bulk" && selected.size > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2 text-[15px]">
              {deleteTarget === "bulk" 
                ? `Are you sure you want to remove ${selected.size} domains from your watchlist?`
                : `Are you sure you want to remove `}
              {deleteTarget !== "bulk" && deleteTarget !== null && (
                <span className="font-mono text-cyan-400 bg-cyan-950/30 px-1 py-0.5 rounded">{deleteTarget}</span>
              )}
              {deleteTarget !== "bulk" && ` from your watchlist?`}
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-zinc-800 bg-zinc-950/50 p-6 sm:justify-end gap-3 mt-6">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="h-10 px-4 rounded-md text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="h-10 px-4 rounded-md text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all flex items-center justify-center min-w-[100px] disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95"
            >
              {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
