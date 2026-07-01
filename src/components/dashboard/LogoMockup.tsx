"use client"

import { useMemo } from "react"

export function LogoMockup({ domain }: { domain: string }) {
  // Extract base name (remove tld)
  const baseName = domain.split(".")[0] || domain
  
  // Deterministic color based on string hash
  const colors = [
    { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
    { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
    { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
    { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  ]
  
  const hash = baseName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const theme = colors[hash % colors.length]

  // Split into two halves for two-tone typography
  const half = Math.ceil(baseName.length / 2)
  const part1 = baseName.slice(0, half)
  const part2 = baseName.slice(half)

  return (
    <div className="relative w-full aspect-[2/1] mb-4 rounded-[4px] bg-zinc-950 border border-zinc-800/80 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-20 blur-xl rounded-full scale-150 ${theme.bg}`} />
      
      {/* The Typography Logo */}
      <div className="relative font-mono font-bold text-2xl tracking-tight select-none pointer-events-none">
        <span className="text-zinc-100">{part1}</span>
        <span className={theme.text}>{part2}</span>
      </div>
    </div>
  )
}
