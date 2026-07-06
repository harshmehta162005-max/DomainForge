"use client"

import { useState } from "react"
import { Clock, Globe, CheckCircle2, Trash2, Wand2, ArrowRightLeft, DollarSign, Filter } from "lucide-react"

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "just now"
  if (h < 1) return `${m}m ago`
  if (d < 1) return `${h}h ago`
  return `${d}d ago`
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  saved:    { icon: Globe,          color: "text-green-400",  bg: "bg-green-950" },
  checked:  { icon: CheckCircle2,   color: "text-cyan-400",   bg: "bg-cyan-950" },
  removed:  { icon: Trash2,         color: "text-red-400",    bg: "bg-red-950" },
  generated:{ icon: Wand2,          color: "text-zinc-400",   bg: "bg-zinc-800" },
  status:   { icon: ArrowRightLeft, color: "text-orange-400", bg: "bg-orange-950" },
  price:    { icon: DollarSign,     color: "text-yellow-400", bg: "bg-yellow-950" },
}



export type HistoryEvent = {
  id: string
  type: string
  domain: string
  ts: string
  note: string
}

export function HistoryList({ initialEvents }: { initialEvents: HistoryEvent[] }) {
  const [duration, setDuration] = useState("all")

  const filteredEvents = initialEvents.filter(e => {
    if (duration === "all") return true
    const diff = Date.now() - new Date(e.ts).getTime()
    const days = parseInt(duration)
    return diff <= days * 86400000
  })

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-end gap-4 border-b border-zinc-800 pb-4">
        <span className="text-xs text-zinc-600 flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={1.5} />
          {filteredEvents.length} events
        </span>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="filter-select h-8 pl-2 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
          >
            <option value="all">All time</option>
            <option value="1">Last 24 hours</option>
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        {filteredEvents.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-zinc-500 mb-4">No history found for this period.</p>
            <a
              href="/generator"
              className="inline-flex items-center h-9 px-4 rounded-[4px] bg-cyan-400 text-zinc-950 text-sm font-medium hover:bg-cyan-300 transition-colors duration-150"
            >
              Generate names →
            </a>
          </div>
        )}

        {filteredEvents.map((event, idx) => {
          const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.checked
          const Icon = cfg.icon
          const isLast = idx === filteredEvents.length - 1
          return (
            <div
              key={event.id}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors duration-100 ${!isLast ? "border-b border-zinc-800/60" : ""}`}
            >
              <div className={`h-8 w-8 rounded-[4px] flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-zinc-100 font-medium">{event.domain}</span>
                  <span className="text-xs text-zinc-500">{event.note}</span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {new Date(event.ts).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="text-xs text-zinc-700 whitespace-nowrap flex-shrink-0 pt-1">
                {timeAgo(event.ts)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
