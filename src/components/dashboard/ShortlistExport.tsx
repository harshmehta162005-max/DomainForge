"use client"

import { ExportButton } from "@/components/dashboard/ExportButton"

interface ShortlistItem {
  id: string
  domain: string
  status: string
  notes: string | null
  created_at: string
}

export function ShortlistExport({ items }: { items: ShortlistItem[] }) {
  const data = items.map(item => ({
    domain: item.domain,
    status: item.status,
    notes: item.notes ?? "",
    added: new Date(item.created_at).toLocaleDateString(),
    register_link: `https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`,
  }))

  return <ExportButton data={data} filename="shortlist" label="Export CSV" />
}
