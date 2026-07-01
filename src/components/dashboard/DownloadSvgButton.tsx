"use client"

import { Download } from "lucide-react"

export function DownloadSvgButton({ domain }: { domain: string }) {
  const baseName = domain.split(".")[0] || domain
  
  // Split into two halves for two-tone typography
  const half = Math.ceil(baseName.length / 2)
  const part1 = baseName.slice(0, half)
  const part2 = baseName.slice(half)

  const downloadSvg = () => {
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
    <button
      onClick={downloadSvg}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] bg-zinc-100 text-zinc-900 text-xs font-semibold hover:bg-white active:scale-95 transition-all"
      title="Download SVG Logo"
    >
      <Download className="h-3.5 w-3.5" strokeWidth={2} />
      Get SVG
    </button>
  )
}
