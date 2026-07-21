import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Bookmark, ExternalLink, ArrowLeft } from "lucide-react"
import { RemoveDomainButton } from "@/components/dashboard/RemoveDomainButton"
import { ShortlistExport } from "@/components/dashboard/ShortlistExport"
import { LogoMockup } from "@/components/dashboard/LogoMockup"
import { DownloadSvgButton } from "@/components/dashboard/DownloadSvgButton"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Shortlist — DomainForge",
  description: "Your shortlisted domain names — top picks ready to register.",
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    available: { bg: "bg-green-950", text: "text-green-400", border: "border-green-800", label: "Available" },
    taken:     { bg: "bg-red-950",   text: "text-red-400",   border: "border-red-800",   label: "Taken" },
    premium:   { bg: "bg-orange-950",text: "text-orange-400",border: "border-orange-800",label: "Premium" },
    unknown:   { bg: "bg-zinc-800",  text: "text-zinc-400",  border: "border-zinc-700",  label: "Unknown" },
  }
  const c = config[status] ?? config.unknown
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[2px] border text-xs font-medium", c.bg, c.text, c.border)}>
      {c.label}
    </span>
  )
}

export default async function ShortlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shortlist } = await supabase
    .from("shortlist")
    .select("id, domain, status, notes, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const items = shortlist ?? []

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Shortlist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Your top picks — domains you&apos;re seriously considering
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <Bookmark className="h-3 w-3" strokeWidth={1.5} />
            {items.length} saved
          </span>
          <ShortlistExport items={items} />
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-[4px] border border-zinc-800 bg-zinc-900 px-6 py-16 text-center">
          <Bookmark className="h-8 w-8 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm text-zinc-400 font-medium mb-1">Your shortlist is empty</p>
          <p className="text-sm text-zinc-600 mb-6">
            When you find a domain you love, click ★ Save to add it here.
          </p>
          <a
            href="/generator"
            className="inline-flex items-center h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
          >
            Generate names →
          </a>
        </div>
      )}

      {/* Shortlist grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(item => (
            <div
              key={item.id as string}
              className="bg-zinc-900 border border-zinc-700 rounded-[4px] p-4 hover:border-cyan-400/40 hover:bg-zinc-800/30 transition-all duration-150 group flex flex-col h-full"
            >
              <LogoMockup domain={item.domain as string} />
              
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-zinc-100 font-medium text-sm" data-domain>
                  {item.domain as string}
                </span>
                <StatusBadge status={item.status as string} />
              </div>

              {item.notes && (
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.notes as string}</p>
              )}

              <div className="text-xs text-zinc-600 mb-3">
                Added {new Date(item.created_at as string).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 mt-auto pt-4 border-t border-zinc-800/60">
                {item.status === "available" ? (
                  <a
                    href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[4px] bg-cyan-400 text-zinc-950 text-xs font-medium hover:bg-cyan-300 transition-colors duration-150"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                    Register
                  </a>
                ) : (
                  <a
                    href={`https://www.namecheap.com/domains/registration/results/?domain=${item.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[4px] bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                    Check
                  </a>
                )}
                
                <div className="flex-1 flex justify-center">
                  <DownloadSvgButton domain={item.domain as string} />
                </div>
                
                <div className="ml-auto">
                  <RemoveDomainButton domain={item.domain as string} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
