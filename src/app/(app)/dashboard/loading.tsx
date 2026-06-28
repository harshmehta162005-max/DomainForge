export default function DashboardLoading() {
  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto space-y-6 animate-skeleton">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-800 rounded-[4px]" />
        <div className="h-4 w-32 bg-zinc-800 rounded-[4px]" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[4px] px-4 py-4 space-y-3">
            <div className="h-3 w-24 bg-zinc-800 rounded-[2px]" />
            <div className="h-7 w-16 bg-zinc-800 rounded-[2px]" />
          </div>
        ))}
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-32 bg-zinc-800 rounded-[4px]" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <div className="p-3 border-b border-zinc-800 flex gap-2">
          <div className="h-8 w-48 bg-zinc-800 rounded-[4px]" />
          <div className="h-8 w-28 bg-zinc-800 rounded-[4px]" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-zinc-800/60">
            <div className="h-4 w-28 bg-zinc-800 rounded-[2px]" />
            <div className="h-4 w-16 bg-zinc-800 rounded-[2px]" />
            <div className="h-4 w-8 bg-zinc-800 rounded-[2px]" />
            <div className="h-4 w-24 bg-zinc-800 rounded-[2px]" />
          </div>
        ))}
      </div>

      {/* Bottom grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[4px] p-4 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-6 bg-zinc-800 rounded-[4px]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full bg-zinc-800 rounded-[2px]" />
                <div className="h-3 w-1/2 bg-zinc-800 rounded-[2px]" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-4 space-y-3">
          <div className="h-4 w-32 bg-zinc-800 rounded-[2px]" />
          <div className="h-20 w-full bg-zinc-800 rounded-[4px]" />
          <div className="h-8 w-24 bg-zinc-800 rounded-[4px]" />
        </div>
      </div>
    </div>
  )
}
