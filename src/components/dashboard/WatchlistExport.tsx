"use client"

import { ExportButton } from "@/components/dashboard/ExportButton"
import type { WatchlistItem } from "@/types/dashboard"

export function WatchlistExport({ items }: { items: WatchlistItem[] }) {
  const data = items.map(item => ({
    domain: item.domain,
    status: item.status,
    score: item.score,
    notes: item.notes ?? "",
    added: new Date(item.createdAt).toLocaleDateString(),
    expires: item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "",
    price_estimate: item.priceEstimate ?? "",
    register_link: `https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`,
  }))

  return <ExportButton data={data} filename="watchlist" label="Export CSV" />
}
