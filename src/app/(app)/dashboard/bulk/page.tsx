"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wand2, Download, Trash2, RefreshCw, ChevronRight,
  CheckCircle, XCircle, AlertCircle, ExternalLink, ArrowLeft, Bookmark, Eye,
} from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface BulkResult {
  keyword: string
  domain: string
  status: "available" | "taken" | "unknown" | "error"
  tld: string
  priceEstimate?: string
  link: string
}

export default function BulkGeneratePage() {
  const [input, setInput] = useState("")
  const [tld, setTld] = useState(".com")
  const [results, setResults] = useState<BulkResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "available" | "taken" | "unknown">("all")

  const TLD_OPTIONS = [".com", ".io", ".ai", ".co", ".app", ".dev", ".net", ".xyz"]

  const keywords = input
    .split(/[\n,;]+/)
    .map(k => k.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(k => k.length >= 2)
    .slice(0, 50) // hard cap at 50

  const handleGenerate = async () => {
    if (keywords.length === 0) return
    setLoading(true)
    setError(null)
    setResults([])
    setProgress(0)

    const domains = keywords.map(k => `${k}${tld}`)
    const allResults: BulkResult[] = []

    // Process in batches of 10 (API max is 20)
    const batchSize = 10
    let done = 0

    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize)
      const keywordBatch = keywords.slice(i, i + batchSize)

      try {
        const res = await fetch("/api/check-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domains: batch }),
        })
        const data = await res.json() as {
          results?: Record<string, { available: boolean; status: string }>
        }

        if (data.results) {
          for (let j = 0; j < batch.length; j++) {
            const domain = batch[j]
            const keyword = keywordBatch[j]
            const r = data.results[domain]
            allResults.push({
              keyword,
              domain,
              status: (r?.status as BulkResult["status"]) ?? "unknown",
              tld,
              link: `https://www.namecheap.com/domains/registration/results/?domain=${domain}`,
            })
          }
        }
      } catch {
        for (let j = 0; j < batch.length; j++) {
          allResults.push({
            keyword: keywordBatch[j],
            domain: batch[j],
            status: "error",
            tld,
            link: `https://www.namecheap.com/domains/registration/results/?domain=${batch[j]}`,
          })
        }
      }

      done += batch.length
      setProgress(Math.round((done / domains.length) * 100))
      setResults([...allResults])
    }

    setLoading(false)
  }

  const handleSaveDomain = async (r: BulkResult, type: "shortlist" | "watchlist") => {
    try {
      await fetch(`/api/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: r.domain,
          status: r.status,
          score: 80,
          tags: ["bulk"],
          notes: `Added from bulk checker`,
        }),
      })
    } catch (error) {
      console.error("Failed to save domain", error)
    }
  }

  const handleExportCSV = () => {
    if (results.length === 0) return
    const headers = ["Keyword", "Domain", "Status", "Register Link"]
    const rows = results.map(r => [r.keyword, r.domain, r.status, r.link])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bulk-check-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const available = results.filter(r => r.status === "available")
  const taken = results.filter(r => r.status === "taken")
  const unknown = results.filter(r => r.status === "unknown" || r.status === "error")

  const StatusIcon = ({ status }: { status: BulkResult["status"] }) => {
    if (status === "available") return <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" strokeWidth={1.5} />
    if (status === "taken") return <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" strokeWidth={1.5} />
    return <AlertCircle className="h-4 w-4 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
  }

  return (
    <div className="px-6 py-8 max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mb-3"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Bulk Checker</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Check availability for up to 50 domain names at once
          </p>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export CSV
          </button>
        )}
      </div>

      {/* Input panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Keywords / Domain names
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"stripe\nlinear\nnotion\ncraft, notion, loom"}
            rows={10}
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none transition-colors leading-relaxed font-mono"
          />
          <p className="text-xs text-zinc-600">
            Separate with newlines, commas, or semicolons. Max 50.{" "}
            <span className="text-zinc-500">{keywords.length} detected.</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* TLD picker */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">TLD to check</label>
            <div className="flex flex-wrap gap-1.5">
              {TLD_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTld(t)}
                  disabled={results.length > 0}
                  className={cn(
                    "px-2.5 py-1 rounded-[4px] text-xs font-mono font-medium border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                    tld === t
                      ? "bg-cyan-950 border-cyan-800 text-cyan-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Stats preview */}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 text-center">
                <p className="text-xl font-mono font-bold text-green-400">{available.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Available</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 text-center">
                <p className="text-xl font-mono font-bold text-red-400">{taken.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Taken</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 text-center">
                <p className="text-xl font-mono font-bold text-zinc-300">{results.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Checked</p>
              </div>
            </motion.div>
          )}

          {/* Run button */}
          <button
            onClick={handleGenerate}
            disabled={keywords.length === 0 || loading}
            className={cn(
              "w-full h-10 flex items-center justify-center gap-2 rounded-[4px] font-medium text-sm transition-all duration-150",
              "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 active:scale-[0.98]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} /> Checking… {progress}%</>
              : <><Wand2 className="h-4 w-4" strokeWidth={1.5} /> Check {keywords.length > 0 ? keywords.length : ""} Domains</>
            }
          </button>

          {/* Progress bar */}
          {loading && (
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Results</p>
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-[4px] p-0.5">
                  {(["all", "available", "taken", "unknown"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-[2px] capitalize transition-colors",
                        filter === f ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Dialog>
                <DialogTrigger render={
                  <button className="text-sm px-3 py-1.5 bg-red-950/20 text-red-400 border border-red-900/50 rounded-[4px] hover:bg-red-950/40 flex items-center gap-1.5 transition-colors font-medium">
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Clear Results
                  </button>
                } />
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                  <DialogTitle>Clear all results?</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Are you sure you want to clear your current bulk check results? This will remove all checked domains.
                  </DialogDescription>
                  <DialogFooter className="bg-zinc-900 border-zinc-800 mt-2 sm:justify-end gap-2">
                    <DialogClose render={
                      <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                        Cancel
                      </button>
                    } />
                    <DialogClose render={
                      <button
                        onClick={() => { setResults([]); setInput(""); setFilter("all"); }}
                        className="px-4 py-2 text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-[4px] border border-red-900/50 transition-colors"
                      >
                        Yes, clear them
                      </button>
                    } />
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Available */}
            {(filter === "all" || filter === "available") && available.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-green-400 font-medium mb-1.5">✓ Available ({available.length})</p>
                {available.map(r => (
                  <motion.div
                    key={r.domain}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-3 py-2.5 bg-green-950/20 border border-green-900/40 rounded-[4px] group"
                  >
                    <StatusIcon status={r.status} />
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm flex-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {r.domain}
                    </a>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'shortlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Bookmark className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Shortlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'watchlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Watchlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Taken */}
            {(filter === "all" || filter === "taken") && taken.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-xs text-zinc-500 font-medium mb-1.5">✗ Taken ({taken.length})</p>
                {taken.map(r => (
                  <div
                    key={r.domain}
                    className="flex items-center gap-3 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-[4px] group"
                  >
                    <StatusIcon status={r.status} />
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm flex-1 text-cyan-400/50 hover:text-cyan-400 transition-colors line-through"
                    >
                      {r.domain}
                    </a>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'shortlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Bookmark className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Shortlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'watchlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Watchlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unknown/Error */}
            {(filter === "all" || filter === "unknown") && unknown.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-xs text-zinc-500 font-medium mb-1.5">? Unknown / Rate limited ({unknown.length})</p>
                {unknown.map(r => (
                  <div
                    key={r.domain}
                    className="flex items-center gap-3 px-3 py-2 bg-zinc-900/40 border border-zinc-800 rounded-[4px] group"
                  >
                    <StatusIcon status={r.status} />
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm flex-1 text-cyan-400/80 hover:text-cyan-400 transition-colors"
                    >
                      {r.domain}
                    </a>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'shortlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Bookmark className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Shortlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider delay={100}>
                        <Tooltip>
                          <TooltipTrigger onClick={() => handleSaveDomain(r, 'watchlist')} className="p-1.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded transition-colors">
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 shadow-xl rounded-md z-[60]">
                            Add to Watchlist
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
