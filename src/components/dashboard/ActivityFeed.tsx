import {
  ArrowRightLeft,
  Bookmark,
  Trash2,
  Wand2,
  CheckCircle2,
  DollarSign,
} from "lucide-react"
import type { ActivityEvent, ActivityEventType } from "@/types/dashboard"
import { cn } from "@/lib/utils"

const EVENT_CONFIG: Record<ActivityEventType, {
  icon: React.ElementType
  iconColor: string
  iconBg: string
}> = {
  status_changed:   { icon: ArrowRightLeft, iconColor: "text-cyan-400",   iconBg: "bg-cyan-950" },
  domain_saved:     { icon: Bookmark,       iconColor: "text-green-400",  iconBg: "bg-green-950" },
  domain_removed:   { icon: Trash2,         iconColor: "text-red-400",    iconBg: "bg-red-950" },
  domain_generated: { icon: Wand2,          iconColor: "text-zinc-400",   iconBg: "bg-zinc-800" },
  check_completed:  { icon: CheckCircle2,   iconColor: "text-green-400",  iconBg: "bg-green-950" },
  price_changed:    { icon: DollarSign,     iconColor: "text-orange-400", iconBg: "bg-orange-950" },
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "just now"
  if (h < 1) return `${m}m ago`
  if (d < 1) return `${h}h ago`
  return `${d}d ago`
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">Recent activity</h2>
      </div>

      <ul className="divide-y divide-zinc-800/40">
        {events.map((event, idx) => {
          const cfg = EVENT_CONFIG[event.type]
          const Icon = cfg.icon
          const isLast = idx === events.length - 1

          return (
            <li key={event.id} className="flex gap-3 px-4 py-3 group hover:bg-zinc-800/20 transition-colors duration-100">
              {/* Icon + timeline line */}
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <div className={cn(
                  "h-6 w-6 rounded-[4px] flex items-center justify-center flex-shrink-0",
                  cfg.iconBg
                )}>
                  <Icon className={cn("h-3 w-3", cfg.iconColor)} strokeWidth={1.5} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 mt-1 bg-zinc-800 min-h-[8px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-xs text-zinc-300 leading-5">
                  <span className="font-mono text-zinc-100">{event.domain}</span>
                  {" — "}
                  {event.message}
                </p>
                {event.meta?.fromStatus && event.meta?.toStatus && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {event.meta.fromStatus} → {event.meta.toStatus}
                  </p>
                )}
                {event.meta?.oldPrice && event.meta?.newPrice && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {event.meta.oldPrice} → {event.meta.newPrice}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-zinc-600 whitespace-nowrap flex-shrink-0 pt-0.5">
                {timeAgo(event.timestamp)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
