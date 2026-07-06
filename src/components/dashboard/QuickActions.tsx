"use client"

import Link from "next/link"
import { Wand2, Plus, Download, RefreshCw, X, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/Toast"

// ─── Add Domain Modal ─────────────────────────────────────────────────────────

function AddDomainModal({ onClose }: { onClose: () => void }) {
  const [domainName, setDomainName] = useState("")
  const [extension, setExtension] = useState(".com")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Combine name and extension
    const baseName = domainName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    const trimmed = `${baseName}${extension}`
    if (!baseName || baseName.length < 2) {
      setError("Please enter a valid domain name.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmed, status: "unknown" }),
      })
      if (res.ok) {
        // Automatically trigger background checks so the table populates with data immediately
        try {
          const baseName = trimmed.split(".")[0]
          await Promise.allSettled([
            fetch("/api/check-domain", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domains: [trimmed], forceRefresh: true }),
            }).then(async (checkRes) => {
              if (checkRes.ok) {
                const data = await checkRes.json()
                const result = data.results?.[trimmed]
                if (result) {
                  await fetch("/api/watchlist", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      domain: trimmed,
                      status: result.status,
                      ...(result.expiresAt ? { expires_at: result.expiresAt } : {})
                    }),
                  })
                }
              }
            }),
            fetch("/api/social-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain: trimmed, baseName }),
            }).then(async (socialRes) => {
              if (socialRes.ok) {
                const data = await socialRes.json()
                const social_x = data.twitter?.handle ?? null
                const social_x_available = data.twitter?.status === "unknown" ? null : data.twitter?.status === "available"
                const social_ig = data.instagram?.handle ?? null
                const social_ig_available = data.instagram?.status === "unknown" ? null : data.instagram?.status === "available"
                
                await fetch("/api/watchlist", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    domain: trimmed,
                    social_x,
                    social_x_available,
                    social_ig,
                    social_ig_available,
                  }),
                })
              }
            }),
            fetch("/api/score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain: trimmed }),
            }).then(async (scoreRes) => {
              if (scoreRes.ok) {
                const { score, tags, priceEstimate } = await scoreRes.json()
                await fetch("/api/watchlist", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ domain: trimmed, score, tags, price_estimate: priceEstimate }),
                })
              }
            })
          ])
        } catch {
          // Ignore background check errors, at least the domain was saved
        }

        setSuccess(true)
        router.refresh()
        setTimeout(onClose, 1200)
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Failed to add domain.")
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80" />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-[6px] overflow-hidden shadow-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">Add domain to watchlist</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Domain name</label>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={domainName}
                onChange={e => setDomainName(e.target.value)}
                placeholder="e.g. forge"
                className="flex-1 h-9 px-3 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <select
                value={extension}
                onChange={e => setExtension(e.target.value)}
                className="filter-select w-24 h-9 pl-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
              >
                <option value=".com">.com</option>
                <option value=".io">.io</option>
                <option value=".ai">.ai</option>
                <option value=".co">.co</option>
                <option value=".app">.app</option>
                <option value=".dev">.dev</option>
                <option value=".net">.net</option>
                <option value=".org">.org</option>
                <option value=".xyz">.xyz</option>
              </select>
            </div>
          </div>



          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="px-4 pb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={domainName.trim().length < 2 || loading || success}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98]",
              success
                ? "bg-green-400/20 border border-green-800 text-green-400"
                : "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {success ? (
              <><Check className="h-4 w-4" /> Added!</>
            ) : loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Adding…</>
            ) : (
              <><Plus className="h-4 w-4" /> Add to watchlist</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── QuickActions ─────────────────────────────────────────────────────────────

export function QuickActions() {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRefreshAll = async () => {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      // Fetch all watchlist domains
      const listRes = await fetch("/api/watchlist")
      if (!listRes.ok) return
      const { watchlist } = await listRes.json() as { watchlist: { domain: string }[] }

      if (watchlist.length === 0) {
        setRefreshMsg("Watchlist is empty.")
        return
      }

      const domains = watchlist.map((w: { domain: string }) => w.domain)

      // Check in batches of 10
      const BATCH = 10
      for (let i = 0; i < domains.length; i += BATCH) {
        const batch = domains.slice(i, i + BATCH)
        await fetch("/api/check-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domains: batch }),
        })
      }
      setRefreshMsg(`Checked ${domains.length} domain${domains.length > 1 ? "s" : ""}`)
      toast(`Refreshed ${domains.length} domain${domains.length > 1 ? "s" : ""}`, "success")
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 3000)
    }
  }

  const handleExport = async () => {
    // Fetch real data then export as CSV
    const listRes = await fetch("/api/watchlist")
    if (!listRes.ok) return
    const { watchlist } = await listRes.json() as {
      watchlist: { id: string; domain: string; status: string; notes: string | null; created_at: string }[]
    }

    const rows = [
      ["Domain", "Status", "Notes", "Added"],
      ...watchlist.map(w => [
        w.domain,
        w.status,
        w.notes ?? "",
        new Date(w.created_at).toLocaleDateString("en-US"),
      ]),
    ]

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `domainforge-watchlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${watchlist.length} domain${watchlist.length !== 1 ? "s" : ""} to CSV`, "success")
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary CTA */}
        <Link
          href="/generator"
          id="quick-action-generate"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
        >
          <Wand2 className="h-4 w-4" strokeWidth={1.5} />
          New generation
        </Link>

        {/* Add domain */}
        <button
          id="quick-action-add"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add domain
        </button>

        {/* Export CSV */}
        <button
          id="quick-action-export"
          onClick={handleExport}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Export CSV
        </button>

        {/* Refresh all */}
        <button
          id="quick-action-refresh"
          onClick={handleRefreshAll}
          disabled={refreshing}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150",
            refreshing && "opacity-60 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} strokeWidth={1.5} />
          {refreshing ? "Checking…" : refreshMsg ?? "Refresh all"}
        </button>
      </div>

      {addModalOpen && <AddDomainModal onClose={() => setAddModalOpen(false)} />}
    </>
  )
}
