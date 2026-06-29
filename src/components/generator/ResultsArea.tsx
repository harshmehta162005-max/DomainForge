"use client"

import { useMemo, useState } from "react"
import { LayoutGrid, List, Download, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveAs } from "file-saver"
import type { DomainSuggestion } from "@/types/domain"
import { DomainResultCard } from "./DomainResultCard"

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-4 space-y-3 animate-skeleton">
      <div className="flex justify-between items-center">
        <div className="h-5 w-32 bg-zinc-800 rounded-[2px]" />
        <div className="h-5 w-16 bg-zinc-800 rounded-[2px]" />
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-zinc-800 rounded-[2px]" />
        <div className="h-3 w-4/5 bg-zinc-800 rounded-[2px]" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-7 w-20 bg-zinc-800 rounded-[4px]" />
        <div className="h-7 w-16 bg-zinc-800 rounded-[4px]" />
        <div className="h-7 w-12 bg-zinc-800 rounded-[4px] ml-auto" />
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyIdle() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
      <div className="font-mono text-4xl text-zinc-800 mb-4 select-none">_</div>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
        Fill in your project description and hit <span className="text-zinc-300 font-medium">Generate names</span> to get AI-powered domain suggestions.
      </p>
      <p className="text-xs text-zinc-700 mt-3 font-mono">Ctrl+Enter to generate</p>
    </div>
  )
}

function EmptyNoResults({ tab }: { tab: string }) {
  if (tab === "available") {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-6">
        <p className="text-sm text-zinc-500">No available domains found in this batch.</p>
        <p className="text-xs text-zinc-700 mt-2">Try different TLDs or regenerate with new parameters.</p>
      </div>
    )
  }
  if (tab === "shortlist") {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-6">
        <p className="text-sm text-zinc-500">Your shortlist is empty.</p>
        <p className="text-xs text-zinc-700 mt-2">Click ★ on any result to save it here.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6">
      <p className="text-sm text-zinc-500">No results match your filters.</p>
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

type SortKey = "score" | "length" | "name" | "availability"
type TabKey = "all" | "available" | "shortlist"

interface ToolbarProps {
  tab: TabKey
  onTabChange: (t: TabKey) => void
  viewMode: "grid" | "list"
  onViewModeChange: (v: "grid" | "list") => void
  sort: SortKey
  onSortChange: (s: SortKey) => void
  tldFilter: string
  onTldFilterChange: (t: string) => void
  availableTlds: string[]
  totalCount: number
  availableCount: number
  shortlistCount: number
  onExport: () => void
}

function ResultsToolbar({
  tab, onTabChange,
  viewMode, onViewModeChange,
  sort, onSortChange,
  tldFilter, onTldFilterChange,
  availableTlds,
  totalCount, availableCount, shortlistCount,
  onExport,
}: ToolbarProps) {
  const tabs = [
    { key: "all" as const,       label: "All results",    count: totalCount },
    { key: "available" as const, label: "Available",      count: availableCount },
    { key: "shortlist" as const, label: "My shortlist",   count: shortlistCount },
  ]

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10">
      {/* Tabs */}
      <div className="flex items-center gap-0 px-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors duration-150",
              tab === t.key
                ? "border-cyan-400 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-[2px] font-mono",
              tab === t.key ? "bg-cyan-950 text-cyan-400" : "bg-zinc-800 text-zinc-600"
            )}>
              {t.count}
            </span>
          </button>
        ))}

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1 shrink-0 pl-3 pb-0.5">
          {/* TLD filter */}
          {availableTlds.length > 1 && (
            <select
              value={tldFilter}
              onChange={e => onTldFilterChange(e.target.value)}
              className="h-7 px-2 bg-zinc-900 border border-zinc-700 rounded-[4px] text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="all">All TLDs</option>
              {availableTlds.map(tld => (
                <option key={tld} value={tld}>{tld}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value as SortKey)}
            className="h-7 px-2 bg-zinc-900 border border-zinc-700 rounded-[4px] text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer hidden sm:block"
          >
            <option value="score">Sort: Score</option>
            <option value="length">Sort: Length</option>
            <option value="name">Sort: Name</option>
            <option value="availability">Sort: Available</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center border border-zinc-700 rounded-[4px] overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={cn("h-7 w-7 flex items-center justify-center transition-colors duration-100",
                viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={cn("h-7 w-7 flex items-center justify-center transition-colors duration-100",
                viewMode === "list" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Export */}
          <button
            onClick={onExport}
            title="Export CSV"
            className="h-7 w-7 flex items-center justify-center rounded-[4px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ResultsArea ─────────────────────────────────────────────────────────────

interface ResultsAreaProps {
  suggestions: DomainSuggestion[]
  phase: string
  shortlist: DomainSuggestion[]
  onShortlist: (s: DomainSuggestion) => void
  onWatchlist: (s: DomainSuggestion) => void
  /** When true, idle/loading/error states are hidden (parent handles them) */
  hideIdleState?: boolean
}

export function ResultsArea({
  suggestions,
  phase,
  shortlist,
  onShortlist,
  onWatchlist,
  hideIdleState = false,
}: ResultsAreaProps) {
  const [tab, setTab] = useState<TabKey>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sort, setSort] = useState<SortKey>("score")
  const [tldFilter, setTldFilter] = useState("all")

  const shortlistIds = useMemo(() => new Set(shortlist.map(s => s.domain)), [shortlist])

  const availableTlds = useMemo(() => {
    const tlds = [...new Set(suggestions.map(s => s.tld))]
    return tlds.sort()
  }, [suggestions])

  const displayed = useMemo(() => {
    let items = suggestions

    // Tab filter
    if (tab === "available") items = items.filter(s => s.availabilityStatus === "available")
    else if (tab === "shortlist") items = shortlist

    // TLD filter
    if (tldFilter !== "all") items = items.filter(s => s.tld === tldFilter)

    // Sort
    const sorted = [...items]
    if (sort === "score") sorted.sort((a, b) => b.score - a.score)
    else if (sort === "length") sorted.sort((a, b) => a.domain.length - b.domain.length)
    else if (sort === "name") sorted.sort((a, b) => a.domain.localeCompare(b.domain))
    else if (sort === "availability") {
      sorted.sort((a, b) => {
        if (a.availabilityStatus === "available" && b.availabilityStatus !== "available") return -1
        if (b.availabilityStatus === "available" && a.availabilityStatus !== "available") return 1
        return 0
      })
    }
    return sorted
  }, [suggestions, shortlist, tab, tldFilter, sort])

  const handleExport = () => {
    if (displayed.length === 0) return
    // Create a hidden form and POST to the server route.
    // The server returns Content-Disposition: attachment which makes the
    // browser download the file with the correct filename — no blob URL tricks.
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "/api/export-csv"
    form.style.display = "none"

    const input = document.createElement("input")
    input.type = "hidden"
    input.name = "domains"
    input.value = JSON.stringify(displayed)
    form.appendChild(input)

    document.body.appendChild(form)
    form.submit()
    setTimeout(() => document.body.removeChild(form), 2000)
  }

  const isLoading = phase === "generating" || phase === "checking"
  const isEmpty = suggestions.length === 0 && !isLoading

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar — only when we have results or are loading */}
      {(suggestions.length > 0 || isLoading) && (
        <ResultsToolbar
          tab={tab}
          onTabChange={setTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sort={sort}
          onSortChange={setSort}
          tldFilter={tldFilter}
          onTldFilterChange={setTldFilter}
          availableTlds={availableTlds}
          totalCount={tldFilter === "all" ? suggestions.length : displayed.length}
          availableCount={tldFilter === "all" ? suggestions.filter(s => s.availabilityStatus === "available").length : displayed.length}
          shortlistCount={shortlist.length}
          onExport={handleExport}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {/* Loading skeletons — only when not delegated to parent */}
        {isLoading && !hideIdleState && <SkeletonGrid />}

        {/* Idle — only when not delegated to parent */}
        {phase === "idle" && isEmpty && !hideIdleState && <EmptyIdle />}

        {/* Error — only when not delegated to parent */}
        {phase === "error" && !hideIdleState && (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <p className="text-sm text-red-400 mb-2">Generation failed</p>
            <p className="text-xs text-zinc-600">Check your description and try again. If the problem persists, try a shorter prompt.</p>
          </div>
        )}

        {/* Empty after done */}
        {phase === "done" && displayed.length === 0 && <EmptyNoResults tab={tab} />}

        {/* Results */}
        {!isLoading && displayed.length > 0 && (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayed.map(s => (
                <DomainResultCard
                  key={s.domain}
                  suggestion={s}
                  isShortlisted={shortlistIds.has(s.domain)}
                  onShortlist={onShortlist}
                  onWatchlist={onWatchlist}
                  viewMode="grid"
                />
              ))}
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-[4px] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-950/50">
                <span className="flex-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Domain</span>
                <span className="w-32 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:block">Score</span>
                <span className="w-20 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:block">Style</span>
                <span className="w-10 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">TLD</span>
                <span className="w-[120px] text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Actions</span>
              </div>
              {displayed.map(s => (
                <DomainResultCard
                  key={s.domain}
                  suggestion={s}
                  isShortlisted={shortlistIds.has(s.domain)}
                  onShortlist={onShortlist}
                  onWatchlist={onWatchlist}
                  viewMode="list"
                />
              ))}
            </div>
          )
        )}

        {/* Metadata footer */}
        {phase === "done" && suggestions.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-700">
                {suggestions.length} names generated · {suggestions.filter(s => s.availabilityStatus === "available").length} available
              </p>
              <div className="flex items-center gap-1 text-xs text-zinc-700">
                <SlidersHorizontal className="h-3 w-3" strokeWidth={1.5} />
                Adjust controls and regenerate for new results
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wider mt-1">
              * Availability is not a trademark or legal clearance check.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
