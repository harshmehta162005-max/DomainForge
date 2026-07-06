import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WatchlistTable } from "@/components/dashboard/WatchlistTable"
import { WatchlistExport } from "@/components/dashboard/WatchlistExport"
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
    .select("id, domain, status, created_at, notes, score, tags, price_estimate, alert_enabled, notify_frequency, notification_preferences, expires_at, social_x, social_ig, social_x_available, social_ig_available")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const watchlistItems: WatchlistItem[] = (watchlistRaw ?? []).map((row) => ({
        id: row.id as string,
        domain: row.domain as string,
        status: (row.status as WatchlistItem["status"]) ?? "unknown",
        score: row.score ?? 0,
        tags: row.tags ?? [],
        notes: row.notes ?? null,
        createdAt: row.created_at as string,
        expiresAt: row.expires_at ?? null,
        priceEstimate: row.price_estimate ?? null,
        priceHistory: [],
        socialX: row.social_x ?? null,
        socialIg: row.social_ig ?? null,
        socialXAvailable: row.social_x_available ?? null,
        socialIgAvailable: row.social_ig_available ?? null,
        alert_enabled: row.alert_enabled ?? true,
        notify_frequency: row.notify_frequency ?? "immediate",
        notification_preferences: row.notification_preferences ?? { availability: true, price_drop: true, expiration: true },
        checkingNow: false,
      }))

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
