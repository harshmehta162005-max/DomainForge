import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { HistoryList } from "@/components/dashboard/HistoryList"

export const metadata: Metadata = {
  title: "History — DomainForge",
  description: "Your domain search and action history.",
}

// mock history and timeAgo moved to HistoryList



export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch real watchlist entries as proxy for history
  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("id, domain, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Merge real data with mock history
  const realEvents = (watchlist ?? []).map((w, i) => ({
    id: `real-${w.id}`,
    type: "saved" as const,
    domain: w.domain as string,
    ts: w.created_at as string,
    note: `Saved to watchlist — ${w.status}`,
  }))

  const allEvents = [...realEvents]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 30)

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-zinc-100">History</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your domain search and action log
        </p>
      </div>

      <HistoryList initialEvents={allEvents} />
    </div>
  )
}
