"use client"

import { useState } from "react"
import { Download, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined
}

interface ExportButtonProps {
  data: ExportRow[]
  filename: string
  label?: string
  className?: string
}

function toCSV(rows: ExportRow[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.join(","),
    ...rows.map(row => headers.map(h => escape(row[h])).join(",")),
  ]
  return lines.join("\n")
}

export function ExportButton({ data, filename, label = "Export CSV", className }: ExportButtonProps) {
  const [done, setDone] = useState(false)

  const handleExport = () => {
    if (data.length === 0) return
    const csv = toCSV(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium transition-all duration-150",
        "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        done && "bg-green-950 border-green-800 text-green-400",
        className,
      )}
    >
      {done
        ? <><Check className="h-3.5 w-3.5" strokeWidth={2} /> Exported!</>
        : <><Download className="h-3.5 w-3.5" strokeWidth={1.5} /> {label}</>
      }
    </button>
  )
}
