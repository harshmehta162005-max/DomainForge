import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { StatsRow } from "@/components/dashboard/StatsRow"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { WatchlistTable } from "@/components/dashboard/WatchlistTable"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { InsightsPanel } from "@/components/dashboard/InsightsPanel"
import { QuickGenerator } from "@/components/dashboard/QuickGenerator"
import { AIAssistant } from "@/components/dashboard/AIAssistant"
import type { WatchlistItem } from "@/types/dashboard"

export const metadata: Metadata = {
  title: "Dashboard — DomainForge",
  description: "Your domain management command center. Monitor watchlist, track availability, and discover new names.",
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch real watchlist from Supabase with new analytics columns
  const { data: watchlistRaw } = await supabase
    .from("watchlist")
    .select("id, domain, status, created_at, notes, score, tags, price_estimate, alert_enabled, notify_frequency, notification_preferences, expires_at, social_x, social_ig, social_x_available, social_ig_available")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  // Fetch shortlist count
  const { count: shortlistCount } = await supabase
    .from("shortlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)

  const watchlistItems: WatchlistItem[] = (watchlistRaw ?? []).map((row) => ({
        id: row.id as string,
        domain: row.domain as string,
        status: (row.status as WatchlistItem["status"]) ?? "unknown",
        score: row.score ?? 0,
        tags: row.tags ?? [],
        notes: row.notes as string | null,
        createdAt: row.created_at as string,
        expiresAt: (row as any).expires_at ?? null,
        priceEstimate: row.price_estimate ?? null,
        priceHistory: [], // Real price history tracking requires cron job
        socialX: (row as any).social_x ?? null,
        socialIg: (row as any).social_ig ?? null,
        socialXAvailable: (row as any).social_x_available ?? null,
        socialIgAvailable: (row as any).social_ig_available ?? null,
        alert_enabled: row.alert_enabled ?? true,
        notify_frequency: (row as any).notify_frequency ?? "immediate",
        notification_preferences: (row as any).notification_preferences ?? { availability: true, price_drop: true, expiration: true },
        checkingNow: false,
      }))

  const availableCount = watchlistItems.filter(i => i.status === "available").length
  const avgScore = watchlistItems.length > 0
    ? Math.round(watchlistItems.reduce((s, i) => s + i.score, 0) / watchlistItems.length)
    : 0

  // Dynamically compute exact score distribution
  const scoreDistribution = [
    { range: "0-20", count: watchlistItems.filter(i => i.score <= 20).length },
    { range: "21-40", count: watchlistItems.filter(i => i.score > 20 && i.score <= 40).length },
    { range: "41-60", count: watchlistItems.filter(i => i.score > 40 && i.score <= 60).length },
    { range: "61-80", count: watchlistItems.filter(i => i.score > 60 && i.score <= 80).length },
    { range: "81-100", count: watchlistItems.filter(i => i.score > 80).length },
  ]

  // Dynamically compute availability trend over the last 7 days based on created_at
  const trend = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(23, 59, 59, 999)
    
    const availableAtDate = watchlistItems.filter(item => 
      item.status === "available" && new Date(item.createdAt) <= d
    ).length
    
    const takenAtDate = watchlistItems.filter(item => 
      item.status !== "available" && new Date(item.createdAt) <= d
    ).length
    
    trend.push({
      date: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      available: availableAtDate,
      taken: takenAtDate
    })
  }

  // Dynamically generate real activity feed based on created_at timestamps
  const activityFeed = watchlistItems.slice(0, 5).map(i => ({
    id: i.id,
    type: "domain_saved" as const,
    domain: i.domain,
    message: "Saved domain to watchlist",
    timestamp: new Date(i.createdAt).toISOString(),
  }))

  const stats = {
    totalDomains: watchlistItems.length + (shortlistCount || 0),
    inWatchlist: watchlistItems.length,
    availableNow: availableCount,
    avgScore,
    totalDelta: 0,
    availableDelta: 0,
  }

  // First name from email
  const firstName = user?.email?.split("@")[0]?.split(".")[0] ?? "there"
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto space-y-6">
      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{formatDate()}</p>
        </div>
        {/* Progress indicator for realtime check */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Realtime active
        </div>
      </div>

      {watchlistItems.length > 0 && (
        <>
          {/* ── Stats row ────────────────────────────────────────────────────── */}
          <StatsRow stats={stats} />

          {/* ── Quick actions ────────────────────────────────────────────────── */}
          <QuickActions />
        </>
      )}

      {/* ── Watchlist table ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-200">Watchlist</h2>
          <span className="text-xs text-zinc-600">
            {watchlistItems.length} domain{watchlistItems.length !== 1 ? "s" : ""}
          </span>
        </div>
        <WatchlistTable items={watchlistItems} />
      </section>

      {watchlistItems.length > 0 && (
        <>
          {/* ── Bottom 3-col grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Activity feed — 2/3 width */}
            <div className="lg:col-span-2">
              <ActivityFeed events={activityFeed} />
            </div>
            {/* Quick generator — 1/3 */}
            <div>
              <QuickGenerator />
            </div>
          </div>

          {/* ── Insights ─────────────────────────────────────────────────────── */}
          <InsightsPanel trend={trend} scoreDistribution={scoreDistribution} />
        </>
      )}

      {/* ── AI Assistant floating ────────────────────────────────────────── */}
      <AIAssistant />
    </div>
  )
}
