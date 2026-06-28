import { useMemo } from "react"
import { Download } from "lucide-react"

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

  const downloadSvg = () => {
    // Generate an SVG string
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#09090b" />
        <text x="200" y="210" font-family="monospace" font-size="64" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
          <tspan fill="#f4f4f5">${part1}</tspan><tspan fill="#22d3ee">${part2}</tspan>
        </text>
      </svg>
    `
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}-logo.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative group w-full aspect-[2/1] mb-4 rounded-[4px] bg-zinc-950 border border-zinc-800/80 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-20 blur-xl rounded-full scale-150 ${theme.bg}`} />
      
      {/* The Typography Logo */}
      <div className="relative z-10 font-mono font-bold text-2xl tracking-tight select-none">
        <span className="text-zinc-100">{part1}</span>
        <span className={theme.text}>{part2}</span>
      </div>

      {/* Download overlay */}
      <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center backdrop-blur-[1px]">
        <button
          onClick={downloadSvg}
          className="flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-zinc-100 text-zinc-900 text-xs font-semibold hover:bg-white active:scale-95 transition-all"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Get SVG
        </button>
      </div>
    </div>
  )
}
