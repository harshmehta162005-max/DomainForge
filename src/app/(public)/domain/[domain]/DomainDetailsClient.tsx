"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, ShieldAlert, Check, Shield } from "lucide-react"
import Link from "next/link"
import type { DomainAnalysis } from "@/types/domain"
import { cn } from "@/lib/utils"

export default function DomainDetailsClient({ domain }: { domain: string }) {
  const [analysis, setAnalysis] = useState<DomainAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bizDesc, setBizDesc] = useState("")
  const [category, setCategory] = useState("")

  const baseName = domain.split(".")[0]
  const currentTld = "." + domain.split(".").slice(1).join(".")

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseName,
          currentTld,
          businessDescription: bizDesc || "General technology or software business",
          categories: category ? [category] : ["General"],
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to analyze domain")
      }

      const data = await res.json()
      setAnalysis(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    runAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const riskColor = 
    analysis?.trademarkRisk === "low" ? "text-green-400" :
    analysis?.trademarkRisk === "medium" ? "text-yellow-400" :
    analysis?.trademarkRisk === "high" ? "text-red-400" :
    "text-zinc-100"

  const RiskIcon = 
    analysis?.trademarkRisk === "low" ? ShieldCheck :
    analysis?.trademarkRisk === "medium" ? AlertTriangle :
    analysis?.trademarkRisk === "high" ? ShieldAlert :
    Shield

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="h-9 px-4 flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className={cn("text-3xl sm:text-5xl font-bold font-mono tracking-tight", riskColor)}>
          {domain}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Trademark Risk & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                AI Trademark & Brand Risk
              </h2>
              <button 
                onClick={() => alert("MarkerAPI integration coming soon! This will run a real trademark search.")}
                className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                Check Real Trademark
              </button>
            </div>
            
            {/* Input form for better analysis */}
            <div className="mb-6 bg-zinc-950 p-4 rounded-md border border-zinc-800/50 space-y-4">
              <p className="text-sm text-zinc-400">
                Improve accuracy by providing specific business context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  className="flex-1 h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Business description (e.g., B2B SaaS for HR)"
                  value={bizDesc}
                  onChange={e => setBizDesc(e.target.value)}
                />
                <input 
                  className="w-full sm:w-48 h-9 bg-zinc-900 border border-zinc-700 rounded-md px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Category (e.g., Software)"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                />
                <button 
                  onClick={runAnalysis}
                  disabled={loading}
                  className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Re-Analyze"}
                </button>
              </div>
            </div>

            {loading && !analysis ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-zinc-400 text-sm animate-pulse">Running global trademark analysis...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-md text-red-400 text-sm">
                {error}
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <RiskIcon className={cn("w-5 h-5", riskColor)} />
                      <span className={cn("text-lg font-bold uppercase tracking-wider", riskColor)}>
                        {analysis.trademarkRisk} RISK
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{analysis.trademarkSummary}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-zinc-100">{analysis.trademarkScore}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Risk Score</div>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-md border border-zinc-800 p-4">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Key Factors</h3>
                  <ul className="space-y-2">
                    {analysis.trademarkKeyReasons.map((reason, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-400">
                        <span className="text-cyan-500 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-md">
                  <p className="text-sm text-cyan-200">
                    <span className="font-semibold text-cyan-400 mr-2">Recommendation:</span>
                    {analysis.trademarkRecommendedAction}
                  </p>
                </div>

                <p className="text-xs text-zinc-600 italic">
                  {analysis.trademarkDisclaimer}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Socials & Alt TLDs */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Social Handles</h2>
            {loading && !analysis ? (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
              </div>
            ) : analysis && analysis.socialSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {analysis.socialSuggestions.map((handle, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                    <span className="text-sm font-mono text-zinc-300">{handle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No suggestions available.</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Alternative TLDs</h2>
            {loading && !analysis ? (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
              </div>
            ) : analysis && analysis.altTlds.length > 0 ? (
              <ul className="space-y-2">
                {analysis.altTlds.map((alt, i) => (
                  <li key={i} className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                    <span className="text-sm font-mono text-zinc-300">{alt.domain}</span>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm border",
                      alt.available 
                        ? "bg-green-950/50 text-green-400 border-green-900" 
                        : "bg-red-950/50 text-red-400 border-red-900"
                    )}>
                      {alt.available ? "Available" : "Taken"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No alternatives analyzed.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
