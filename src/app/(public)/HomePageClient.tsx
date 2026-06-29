"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import ShinyButton from "@/components/ui/shiny-button"

// ─── Keyframes ────────────────────────────────────────────────────────────────
const keyframes = `
  @keyframes scroll-grid {
    0%   { background-position: 0 0; }
    100% { background-position: -100px -100px; }
  }
  @keyframes fade-in-up {
    0%   { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
`

const TLDS = [".com", ".io", ".ai", ".co", ".app", ".dev", ".xyz", ".so"]

/**
 * Client-side interactive portion of the landing page.
 * The outer wrapper (page.tsx) is a Server Component that renders LandingNav.
 * This component handles only the form + hero interaction.
 */
export default function HomePageClient() {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || isLoading) return
    setIsLoading(true)
    sessionStorage.setItem("df_description", description.trim())
    router.push("/generate")
  }

  return (
    <>
      <style>{keyframes}</style>

      <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">

        {/* Background graphic */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              maskImage: `linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%),
                          linear-gradient(to right, black 0%, black 15%, transparent 25%, transparent 75%, black 85%, black 100%),
                          linear-gradient(to right, black 0%, black 25%, transparent 35%, transparent 65%, black 75%, black 100%),
                          linear-gradient(to bottom, black 0%, black 25%, transparent 40%, transparent 60%, black 75%, black 100%)`,
              maskComposite: "intersect",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-blue-600 opacity-90" />
            <div className="absolute inset-0" style={{ perspective: "1000px" }}>
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 50px),
                                    repeating-linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 50px)`,
                  transform: "rotateX(60deg) translateY(20%)",
                  transformOrigin: "bottom",
                  animation: "scroll-grid 10s linear infinite",
                }}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="relative z-10 text-center flex flex-col items-center w-full max-w-3xl px-4">

          <div
            className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-full px-4 py-1 text-sm mb-6 flex items-center gap-2"
            style={{ animation: "fade-in 1s ease-out" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-orange-400"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            AI-powered domain name discovery
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4"
            style={{ animation: "fade-in-up 0.8s ease-out 0.2s backwards" }}
          >
            Find the perfect domain
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-blue-400">
              for your idea
            </span>
          </h1>

          <p
            className="text-gray-300 mb-10 max-w-xl text-lg md:text-xl"
            style={{ animation: "fade-in-up 0.8s ease-out 0.4s backwards" }}
          >
            Describe your business and get 20+ AI-generated domain suggestions
            with real-time availability across 1000+ TLDs.
          </p>

          <form
            onSubmit={handleGenerate}
            className="w-full"
            style={{ animation: "fade-in-up 0.8s ease-out 0.6s backwards" }}
          >
            <div className="relative bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-1 flex flex-col sm:flex-row gap-2 backdrop-blur-sm">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Describe your business — e.g. "A coffee subscription for remote workers"`}
                rows={2}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerate(e as unknown as React.FormEvent)
                  }
                }}
              />
              <ShinyButton
                onClick={handleGenerate}
                disabled={!description.trim() || isLoading}
                className="self-end sm:self-auto"
              >
                {isLoading ? "Loading…" : "Generate names →"}
              </ShinyButton>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Press Enter to generate · No account needed · Free to use
            </p>
          </form>
        </main>

        {/* Footer TLDs */}
        <footer
          className="absolute bottom-0 left-0 right-0 p-6 md:px-12 z-10"
          style={{ animation: "fade-in 1s ease-out 1s backwards" }}
        >
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg backdrop-blur-sm text-center">
            <p className="text-xs text-gray-300 font-medium tracking-wide uppercase mb-1.5">
              Smart Availability Routing
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Featuring our <span className="text-gray-200 font-medium">3-Tier Availability Check</span>: Verified registry checks for major TLDs, standard lookups for other gTLDs, and intelligent fallback for unverified ccTLDs.
            </p>
          </div>

          <p className="text-center text-gray-600 text-xs mb-3 uppercase tracking-widest">
            Checks availability across
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            {TLDS.map((tld) => (
              <span
                key={tld}
                className="font-mono text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-default"
              >
                {tld}
              </span>
            ))}
            <span className="text-gray-600 text-sm">+ 1000 more</span>
          </div>
        </footer>
      </div>
    </>
  )
}
