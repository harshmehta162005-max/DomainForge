"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, Shield, ExternalLink, Sparkles, Info } from "lucide-react"
import Link from "next/link"
import type { DomainAnalysis } from "@/types/domain"
import { cn } from "@/lib/utils"

// ─── Risk Score Visual Ring ────────────────────────────────────────────────────

function RiskScoreRing({ score, risk }: { score: number; risk: "low" | "medium" | "high" }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference
  const color = risk === "low" ? "#4ade80" : risk === "medium" ? "#facc15" : "#f87171"

  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        {/* Track */}
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#27272a" strokeWidth="7" />
        {/* Progress */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono text-zinc-100">{score}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  )
}

// ─── Confidence Badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: "low" | "medium" | "high" }) {
  const config = {
    low: { label: "Low Confidence", cls: "bg-zinc-800 text-zinc-400 border-zinc-700" },
    medium: { label: "Medium Confidence", cls: "bg-yellow-950/50 text-yellow-400 border-yellow-900/50" },
    high: { label: "High Confidence", cls: "bg-green-950/50 text-green-400 border-green-900/50" },
  }
  const { label, cls } = config[confidence]
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wider", cls)}>
      <Info className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DomainDetailsClient({ domain }: { domain: string }) {
  const [analysis, setAnalysis] = useState<DomainAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAutoLoad, setIsAutoLoad] = useState(true)  // true on first mount
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  const [bizDesc, setBizDesc] = useState("")
  const [category, setCategory] = useState("")

  const baseName = domain.split(".")[0]
  const currentTld = "." + domain.split(".").slice(1).join(".")

  // Core fetch function — shared by auto-load and manual trigger
  const fetchAnalysis = async (opts: { desc?: string; cats?: string[]; silent?: boolean }) => {
    if (!opts.silent) setLoading(true)
    setError(null)
    setHasRun(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseName,
          currentTld,
          businessDescription: opts.desc || "General technology or software business",
          categories: opts.cats ?? ["General"],
        }),
      })
      if (!res.ok) throw new Error("Analysis failed — please try again.")
      const data = await res.json()
      setAnalysis(data)
    } catch (err: any) {
      if (!opts.silent) setError(err.message)
    } finally {
      setLoading(false)
      setIsAutoLoad(false)
    }
  }

  // Auto-load on mount: hits the cache first, transparent to user if cached
  useEffect(() => {
    fetchAnalysis({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain])

  // Manual re-analyze with user-provided context
  const runAnalysis = () => {
    setIsAutoLoad(false)
    fetchAnalysis({
      desc: bizDesc || "General technology or software business",
      cats: category ? [category] : ["General"],
    })
  }

  const riskColor =
    analysis?.trademarkRisk === "low" ? "text-green-400" :
    analysis?.trademarkRisk === "medium" ? "text-yellow-400" :
    analysis?.trademarkRisk === "high" ? "text-red-400" :
    "text-zinc-100"

  const riskBorder =
    analysis?.trademarkRisk === "low" ? "border-green-900/40" :
    analysis?.trademarkRisk === "medium" ? "border-yellow-900/40" :
    analysis?.trademarkRisk === "high" ? "border-red-900/40" :
    "border-zinc-800"

  const RiskIcon =
    analysis?.trademarkRisk === "low" ? ShieldCheck :
    analysis?.trademarkRisk === "medium" ? AlertTriangle :
    analysis?.trademarkRisk === "high" ? ShieldAlert :
    Shield

  // USPTO TESS direct search URL
  const usptoUrl = `https://tmsearch.uspto.gov/search/search-information?query=${encodeURIComponent(baseName)}&searchType=structured`

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="h-9 px-4 flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className={cn("text-3xl sm:text-5xl font-bold font-mono tracking-tight", analysis ? riskColor : "text-zinc-100")}>
          {domain}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Trademark Risk */}
        <div className="lg:col-span-2 space-y-6">
          <div className={cn("bg-zinc-900 border rounded-md p-6 relative overflow-hidden transition-colors", analysis ? riskBorder : "border-zinc-800")}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
              <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                AI Trademark & Brand Risk
              </h2>
              {/* Real USPTO search link — replaces the broken alert() button */}
              <a
                href={usptoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Search USPTO TESS
              </a>
            </div>

            {/* Context form */}
            <div className="mb-5 bg-zinc-950 p-4 rounded-md border border-zinc-800/50 space-y-3">
              <p className="text-xs text-zinc-500">
                Add business context for a more accurate assessment. Results are cached for 24h per domain.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className="flex-1 h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Business description (e.g., B2B SaaS for HR teams)"
                  value={bizDesc}
                  onChange={e => setBizDesc(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runAnalysis()}
                />
                <input
                  className="w-full sm:w-44 h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Category (e.g., SaaS)"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runAnalysis()}
                />
                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="h-9 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
                >
                  {loading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
                    : <><Sparkles className="w-4 h-4" /> {analysis ? "Re-Analyze" : "Run Analysis"}</>
                  }
                </button>
              </div>
            </div>

            {/* Result area */}
            {loading && !analysis ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-zinc-400 text-sm animate-pulse">
                  {isAutoLoad ? "Loading saved analysis..." : "Running trademark risk assessment..."}
                </p>
                <p className="text-zinc-600 text-xs">
                  {isAutoLoad ? "Checking for previously cached results" : "Checking exact matches, phonetic similarity, and category density"}
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-md text-red-400 text-sm">
                {error}
              </div>
            ) : analysis ? (
              <div className="space-y-5">

                {/* Risk Score Ring + Summary */}
                <div className="flex items-start gap-5">
                  <RiskScoreRing score={analysis.trademarkScore} risk={analysis.trademarkRisk} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <RiskIcon className={cn("w-5 h-5 shrink-0", riskColor)} />
                      <span className={cn("text-lg font-bold uppercase tracking-wider", riskColor)}>
                        {analysis.trademarkRisk} RISK
                      </span>
                      <ConfidenceBadge confidence={analysis.trademarkConfidence} />
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{analysis.trademarkSummary}</p>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="bg-zinc-950 rounded-md border border-zinc-800 p-4">
                  <h3 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Key Risk Factors</h3>
                  <ul className="space-y-2">
                    {analysis.trademarkKeyReasons.map((reason, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-zinc-400">
                        <span className="text-cyan-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* USPTO Note (AI-generated) */}
                {analysis.trademarkUsptoDatabaseNote && (
                  <div className="bg-zinc-950 rounded-md border border-zinc-800 p-4">
                    <h3 className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" />
                      USPTO Registry Note (AI)
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{analysis.trademarkUsptoDatabaseNote}</p>
                    <a
                      href={usptoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Verify on USPTO TESS <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Live USPTO Records from MarkerAPI */}
                <div className="bg-zinc-950 rounded-md border border-zinc-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-cyan-500" />
                      Live USPTO Records
                      {analysis.usptoSearched && (
                        <span className="ml-1 text-[10px] font-normal bg-cyan-950/60 text-cyan-400 border border-cyan-900/50 px-1.5 py-0.5 rounded">
                          Real Data
                        </span>
                      )}
                    </h3>
                    {analysis.usptoSearched && analysis.usptoHits.length > 0 && (
                      <span className="text-[10px] text-zinc-500">{analysis.usptoHits.length} active mark{analysis.usptoHits.length !== 1 ? "s" : ""} found</span>
                    )}
                  </div>

                  {!analysis.usptoSearched ? (
                    <div className="text-xs text-zinc-600 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-700" />
                      <span>
                        Live USPTO database search not configured.{" "}
                        <a href="https://markerapi.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-400 transition-colors">
                          Add MarkerAPI credentials
                        </a>{" "}
                        to see real trademark records alongside AI analysis.
                      </span>
                    </div>
                  ) : analysis.usptoHits.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>No active USPTO trademarks found for <strong className="font-mono">{baseName}</strong> — good sign!</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.usptoHits.map((hit, i) => (
                        <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-md">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <span className="text-sm font-semibold font-mono text-zinc-100">{hit.wordmark}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap shrink-0",
                              hit.status.includes("LIVE") || hit.status.includes("REGISTERED")
                                ? "bg-red-950/60 text-red-400 border-red-900/50"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            )}>
                              {hit.status.replace("LIVE/", "").replace("DEAD/", "").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{hit.description}</p>
                          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-600">
                            {hit.code && (
                              <span><span className="text-zinc-500">Class:</span> IC {hit.code}</span>
                            )}
                            {hit.owner && (
                              <span><span className="text-zinc-500">Owner:</span> {hit.owner}</span>
                            )}
                            {hit.registrationdate && (
                              <span><span className="text-zinc-500">Registered:</span> {hit.registrationdate}</span>
                            )}
                            {hit.serialnumber && (
                              <a
                                href={`https://tsdrapi.uspto.gov/ts/cd/casestatus/${hit.serialnumber}/info.json`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-600 hover:text-cyan-400 transition-colors flex items-center gap-0.5"
                              >
                                #{hit.serialnumber} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-md">
                  <p className="text-sm text-cyan-200">
                    <span className="font-semibold text-cyan-400 mr-2">Recommended Action:</span>
                    {analysis.trademarkRecommendedAction}
                  </p>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-zinc-600 italic leading-relaxed">
                  {analysis.trademarkDisclaimer}
                </p>

                {/* Re-analyze hint */}
                {loading && (
                  <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center rounded-md">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Socials & Alt TLDs */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">Social Handles</h2>
            {!hasRun ? (
              <p className="text-sm text-zinc-600">Run analysis to see social handle suggestions.</p>
            ) : loading && !analysis ? (
              <div className="h-28 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
              </div>
            ) : analysis && analysis.socialSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {analysis.socialSuggestions.map((handle, i) => (
                  <li key={i} className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-md">
                    <span className="text-sm font-mono text-zinc-300">{handle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 italic">No suggestions generated — try re-analyzing with a business description.</p>
            )}

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">Alternative TLDs</h2>
            {loading && !analysis ? (
              <div className="h-28 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
              </div>
            ) : analysis && analysis.altTlds.length > 0 ? (
              <ul className="space-y-2">
                {analysis.altTlds.map((alt, i) => (
                  <li key={i} className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-md">
                    <span className="text-sm font-mono text-zinc-300">{alt.domain}</span>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm border",
                      alt.available
                        ? "bg-green-950/50 text-green-400 border-green-900"
                        : alt.status === "unknown"
                          ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                          : "bg-red-950/50 text-red-400 border-red-900"
                    )}>
                      {alt.status === "unknown" ? "Unknown" : alt.available ? "Available" : "Taken"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">Run analysis to check TLD availability.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
