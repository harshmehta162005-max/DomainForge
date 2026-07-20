import type { AvailabilityTrend, ScoreDistribution } from "@/types/dashboard"

// ─── Simple inline SVG bar chart ─────────────────────────────────────────────

function BarChart({ data }: { data: ScoreDistribution[] }) {
  const maxCount = Math.max(...data.map(d => d.count))
  return (
    <div className="flex items-end gap-2 h-20 lg:h-28 mt-2 transition-all duration-200">
      {data.map(({ range, count }) => {
        const heightPct = (count / maxCount) * 100
        return (
          <div key={range} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
            <div
              className="w-full bg-cyan-400/20 border-t border-cyan-400 rounded-t-[2px] transition-all duration-300"
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-xs text-zinc-600 font-mono">{range}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Simple inline SVG line chart ────────────────────────────────────────────

function LineChart({ data }: { data: AvailabilityTrend[] }) {
  const w = 280
  const h = 64
  const n = data.length
  if (n < 2) return null

  const maxAvail = Math.max(...data.map(d => d.available))
  const maxTaken = Math.max(...data.map(d => d.taken))
  const maxAll = Math.max(maxAvail, maxTaken, 1)

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => `${(i / (n - 1)) * w},${h - (v / maxAll) * h}`).join(" ")

  return (
    // overflow-hidden removed: was clipping x-axis labels at narrow widths.
    // The SVG handles its own bounds via viewBox + preserveAspectRatio.
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-4 bg-green-400 rounded-full" />
          <span className="text-xs text-zinc-500">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-4 bg-red-400 rounded-full" />
          <span className="text-xs text-zinc-500">Taken</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 lg:h-24 transition-all duration-200">
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => (
          <line
            key={t}
            x1={0} y1={h - t * h}
            x2={w} y2={h - t * h}
            stroke="#27272a"
            strokeWidth={1}
          />
        ))}
        {/* Available line */}
        <polyline
          points={toPoints(data.map(d => d.available))}
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Taken line */}
        <polyline
          points={toPoints(data.map(d => d.taken))}
          fill="none"
          stroke="#f87171"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        {data.map(d => (
          <span key={d.date} className="text-xs text-zinc-700 first:block last:block hidden first:flex last:flex">
            {d.date}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── InsightsPanel ────────────────────────────────────────────────────────────

interface InsightsPanelProps {
  trend: AvailabilityTrend[]
  scoreDistribution: ScoreDistribution[]
}

export function InsightsPanel({ trend, scoreDistribution }: InsightsPanelProps) {
  const latestAvail = trend[trend.length - 1]?.available ?? 0
  const prevAvail = trend[trend.length - 2]?.available ?? 0
  const delta = latestAvail - prevAvail

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">Insights</h2>
      </div>

      {/* Availability trend + Score distribution stacked vertically */}
      <div className="px-4 py-4 flex flex-col gap-6">
        {/* Availability trend */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Availability trend
            </h3>
            <span className={delta >= 0 ? "text-xs text-green-400" : "text-xs text-red-400"}>
              {delta >= 0 ? "+" : ""}{delta} today
            </span>
          </div>
          <LineChart data={trend} />
        </div>

        {/* Score distribution */}
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Score distribution
          </h3>
          <BarChart data={scoreDistribution} />
        </div>
      </div>
    </div>
  )
}
