import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { StatsRow } from "@/components/dashboard/StatsRow"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { WatchlistTable } from "@/components/dashboard/WatchlistTable"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { InsightsPanel } from "@/components/dashboard/InsightsPanel"
import { QuickGenerator } from "@/components/dashboard/QuickGenerator"
import { AIAssistant } from "@/components/dashboard/AIAssistant"
import {
  MOCK_STATS,
  MOCK_ACTIVITY,
  MOCK_TREND,
  MOCK_SCORE_DIST,
} from "@/lib/dashboard/mock"
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

  // Fetch real watchlist from Supabase
  const { data: watchlistRaw } = await supabase
    .from("watchlist")
    .select("id, domain, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  // Merge real data with mock enrichment (score, tags, etc.)
  // In production these fields come from DB columns; for now we mock-augment
  const { MOCK_WATCHLIST } = await import("@/lib/dashboard/mock")

  const watchlistItems: WatchlistItem[] = (watchlistRaw ?? []).length > 0
    ? (watchlistRaw ?? []).map((row, i) => ({
        id: row.id as string,
        domain: row.domain as string,
        status: (row.status as WatchlistItem["status"]) ?? "unknown",
        score: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.score ?? 80,
        tags: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.tags ?? [],
        notes: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.notes ?? null,
        createdAt: row.created_at as string,
        expiresAt: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.expiresAt ?? null,
        priceEstimate: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.priceEstimate ?? null,
        priceHistory: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.priceHistory ?? [],
        socialX: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.socialX ?? null,
        socialIg: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.socialIg ?? null,
        socialXAvailable: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.socialXAvailable ?? null,
        socialIgAvailable: MOCK_WATCHLIST[i % MOCK_WATCHLIST.length]?.socialIgAvailable ?? null,
        alert_enabled: true,
        checkingNow: false,
      }))
    : MOCK_WATCHLIST // Fall back to mock data if watchlist is empty

  // Derive stats from real or mock data
  const availableCount = watchlistItems.filter(i => i.status === "available").length
  const avgScore = watchlistItems.length > 0
    ? Math.round(watchlistItems.reduce((s, i) => s + i.score, 0) / watchlistItems.length)
    : MOCK_STATS.avgScore

  const stats = {
    ...MOCK_STATS,
    inWatchlist: watchlistItems.length,
    availableNow: availableCount > 0 ? availableCount : MOCK_STATS.availableNow,
    avgScore,
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

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <StatsRow stats={stats} />

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <QuickActions />

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

      {/* ── Bottom 3-col grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed — 2/3 width */}
        <div className="lg:col-span-2">
          <ActivityFeed events={MOCK_ACTIVITY} />
        </div>
        {/* Quick generator — 1/3 */}
        <div>
          <QuickGenerator />
        </div>
      </div>

      {/* ── Insights ─────────────────────────────────────────────────────── */}
      <InsightsPanel trend={MOCK_TREND} scoreDistribution={MOCK_SCORE_DIST} />

      {/* ── AI Assistant floating ────────────────────────────────────────── */}
      <AIAssistant />
    </div>
  )
}
