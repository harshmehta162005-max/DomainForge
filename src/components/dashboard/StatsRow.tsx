import { Globe, CheckCircle, Eye, TrendingUp, TrendingDown } from "lucide-react"
import type { DashboardStats } from "@/types/dashboard"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number | string
  delta?: number
  icon: React.ReactNode
  valueColor?: string
  suffix?: string
}

function StatCard({ label, value, delta, icon, valueColor, suffix }: StatCardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNeutral = delta === undefined || delta === 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] px-3 sm:px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-zinc-600">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        {/*
          text-xl on mobile prevents the value overflowing a ~148px card at 320px.
          sm:text-2xl restores the design-spec size on tablet+.
        */}
        <span className={cn("text-xl sm:text-2xl font-semibold tabular-nums", valueColor ?? "text-zinc-100")}>
          {value}{suffix}
        </span>
        {/*
          Delta text is hidden on mobile: "+X this week" wraps at narrow card widths
          and isn't worth the visual noise. Shown sm+ where cards are wider.
        */}
        {delta !== undefined && !isNeutral && (
          <span
            className={cn(
              "hidden sm:flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3 w-3" strokeWidth={2} />
            )}
            {isPositive ? "+" : ""}{delta} this week
          </span>
        )}
      </div>
    </div>
  )
}

interface StatsRowProps {
  stats: DashboardStats
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total domains"
        value={stats.totalDomains}
        delta={stats.totalDelta}
        icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
      />
      <StatCard
        label="Available now"
        value={stats.availableNow}
        delta={stats.availableDelta}
        icon={<CheckCircle className="h-4 w-4" strokeWidth={1.5} />}
        valueColor="text-green-400"
      />
      <StatCard
        label="In watchlist"
        value={stats.inWatchlist}
        icon={<Eye className="h-4 w-4" strokeWidth={1.5} />}
        valueColor="text-cyan-400"
      />
      <StatCard
        label="Avg AI score"
        value={stats.avgScore}
        icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
        suffix="/100"
      />
    </div>
  )
}
