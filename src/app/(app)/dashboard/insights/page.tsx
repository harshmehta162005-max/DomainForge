import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { InsightsPanel } from "@/components/dashboard/InsightsPanel"
import { TrendingUp, Globe, CheckCircle, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Insights — DomainForge",
  description: "Analytics and trends for your domain portfolio.",
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon: Icon, valueColor }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  valueColor?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-zinc-600" strokeWidth={1.5} />
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${valueColor ?? "text-zinc-100"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Tag Distribution ─────────────────────────────────────────────────────────

function TagBar({ tag, count, total }: { tag: string; count: number; total: number }) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-zinc-400 w-20 truncate">{tag}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-600 w-6 text-right tabular-nums">{count}</span>
    </div>
  )
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: watchlist },
    { data: shortlist }
  ] = await Promise.all([
    supabase.from("watchlist").select("id, domain, status, created_at").eq("user_id", user!.id),
    supabase.from("shortlist").select("id, domain, status, created_at").eq("user_id", user!.id)
  ])

  const wlItems = watchlist ?? []
  const slItems = shortlist ?? []
  
  const allItems = [...wlItems, ...slItems]
  // Deduplicate by domain just in case a domain is in both
  const uniqueDomains = new Map<string, any>()
  for (const item of allItems) {
    uniqueDomains.set(item.domain, item)
  }
  const uniqueItems = Array.from(uniqueDomains.values())

  const total = uniqueItems.length
  const availCount = uniqueItems.filter(i => i.status === "available").length
  const wlCount = wlItems.length
  const slCount = slItems.length

  // TLD distribution
  const tldMap: Record<string, number> = {}
  uniqueItems.forEach(w => {
    const parts = (w.domain as string).split(".")
    if (parts.length > 1) {
      const tld = "." + parts.slice(1).join(".")
      tldMap[tld] = (tldMap[tld] ?? 0) + 1
    }
  })
  const tldDist = Object.entries(tldMap).sort((a, b) => b[1] - a[1])

  // Simple trend: last 7 days count of created_at
  const trendData = []
  const scoreDistData = [
    { range: "Premium", count: uniqueItems.filter(i => i.status === "premium").length },
    { range: "Available", count: availCount },
    { range: "Taken", count: uniqueItems.filter(i => i.status === "taken").length },
    { range: "Checking", count: uniqueItems.filter(i => i.status === "checking" || i.status === "unknown").length },
  ]

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    
    // Count how many items were added on this date
    const itemsOnDate = uniqueItems.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split("T")[0]
      return itemDate === dateStr
    })
    
    trendData.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: itemsOnDate.length,
      available: itemsOnDate.filter(i => i.status === "available").length,
      taken: itemsOnDate.filter(i => i.status === "taken").length
    })
  }

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-zinc-100">Insights</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Portfolio analytics and availability trends</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total tracked" value={total} sub="unique domains" icon={Globe} />
        <MetricCard label="Available now" value={availCount} sub="ready to register" icon={CheckCircle} valueColor="text-green-400" />
        <MetricCard label="Watchlisted" value={wlCount} icon={TrendingUp} valueColor="text-cyan-400" />
        <MetricCard label="Shortlisted" value={slCount} icon={Star} valueColor="text-yellow-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsPanel trend={trendData} scoreDistribution={scoreDistData} />

        {/* Status distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-200">Status breakdown</h2>
          </div>
          <div className="px-4 py-8 flex-1 flex flex-col justify-center gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["available", "taken", "premium", "unknown"] as const).map(status => {
                const count = uniqueItems.filter(w => w.status === status).length
                const colors: Record<string, string> = {
                  available: "text-green-400",
                  taken: "text-red-400",
                  premium: "text-orange-400",
                  unknown: "text-zinc-400",
                }
                return (
                  <div key={status} className="text-center">
                    <p className={`text-3xl font-semibold tabular-nums ${colors[status]}`}>{count}</p>
                    <p className="text-xs text-zinc-500 capitalize mt-2">{status}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TLD breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-200">TLD breakdown</h2>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {tldDist.length > 0 ? tldDist.map(([tld, count]) => (
              <div key={tld} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-[4px]">
                <span className="text-xs font-mono text-zinc-300">{tld}</span>
                <span className="text-xs text-zinc-600">×{count}</span>
              </div>
            )) : (
              <span className="text-xs text-zinc-500">No domains tracked yet.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
