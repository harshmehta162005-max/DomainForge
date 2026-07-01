import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WatchlistTable } from "@/components/dashboard/WatchlistTable"
import { WatchlistExport } from "@/components/dashboard/WatchlistExport"
import { MOCK_WATCHLIST } from "@/lib/dashboard/mock"
import type { WatchlistItem } from "@/types/dashboard"

export const metadata: Metadata = {
  title: "Watchlist — DomainForge",
  description: "Monitor your saved domains and track availability changes.",
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: watchlistRaw } = await supabase
    .from("watchlist")
    .select("id, domain, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

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
    : MOCK_WATCHLIST

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {watchlistItems.length} domain{watchlistItems.length !== 1 ? "s" : ""} being monitored
          </p>
        </div>
        <WatchlistExport items={watchlistItems} />
      </div>
      <WatchlistTable items={watchlistItems} />
    </div>
  )
}
