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
  /* Honour prefers-reduced-motion for inline keyframe animations */
  @media (prefers-reduced-motion: reduce) {
    .hero-animate { animation: none !important; opacity: 1 !important; transform: none !important; }
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

      {/*
        min-h-[calc(100svh-64px)] instead of h-[calc(100vh-64px)]:
        1. svh = "small viewport height" — accounts for iOS Safari's dynamic toolbar
           (which shrinks on scroll, inflating `100vh` to include the hidden bar).
        2. min-h instead of h lets the container grow beyond the viewport if the
           content is taller than expected (e.g., large font on landscape mobile).
      */}
      <div className="relative w-full min-h-[calc(100svh-64px)] flex flex-col items-center overflow-hidden">

        {/* Background graphic */}
        <div className="absolute inset-0 w-full h-full overflow-hidden -z-0">
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
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 pt-4 pb-2">
          <main className="relative text-center flex flex-col items-center w-full max-w-4xl px-4 sm:px-6">

            {/* Badge */}
            <div
              className="hero-animate bg-gray-800 bg-opacity-50 border border-gray-700 rounded-full px-4 py-1 text-sm mb-4 flex items-center gap-2"
              style={{ animation: "fade-in 1s ease-out" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-orange-400"
                style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
              />
              AI-powered domain name discovery
            </div>

            {/*
              Fluid heading: clamp(1.75rem, 6vw, 4.5rem)
              - 1.75rem (28px) floor — readable on 320px portrait
              - 6vw mid — scales proportionally with viewport
              - 4.5rem (72px) ceiling — matches the original lg:text-7xl intent
              Replaces the 3-breakpoint stack (text-4xl md:text-6xl lg:text-7xl)
              with a single, smooth scale. No breakpoint tokens exist for clamp().
            */}
            <h1
              className="hero-animate font-bold leading-tight mb-4"
              style={{
                fontSize: "clamp(1.75rem, 6vw, 4.5rem)",
                animation: "fade-in-up 0.8s ease-out 0.2s backwards",
              }}
            >
              Find the perfect domain
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-blue-400">
                for your idea
              </span>
            </h1>

            {/*
              max-w-prose (65ch) caps line length for readability.
              text-base sm:text-lg sm:text-xl avoids 2-step breakpoint stacking —
              here just sm:text-xl is sufficient (one step up from base).
            */}
            <p
              className="hero-animate text-gray-300 mb-6 max-w-prose text-base sm:text-xl"
              style={{ animation: "fade-in-up 0.8s ease-out 0.4s backwards" }}
            >
              Describe your business and get 20+ AI-generated domain suggestions
              with real-time availability across 1000+ TLDs.
            </p>

            <form
              onSubmit={handleGenerate}
              className="hero-animate w-full max-w-3xl mx-auto"
              style={{ animation: "fade-in-up 0.8s ease-out 0.6s backwards" }}
            >
              {/*
                flex-col by default — textarea stacks above the button on mobile.
                sm:flex-row restores the side-by-side layout on tablet+.
                This prevents the button from squishing the textarea at 320px.
              */}
              <div className="relative bg-gray-800 bg-opacity-60 border border-gray-700 rounded-lg p-1 flex flex-col sm:flex-row gap-2 backdrop-blur-sm focus-within:ring-1 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 focus-within:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-500">
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
                {/*
                  w-full on mobile so the button spans the full card width.
                  sm:w-auto + sm:self-center restores the inline layout on sm+.
                  min-h-11 ensures ≥44px touch target on mobile.
                */}
                <div className="w-full sm:w-auto sm:self-center sm:mr-1">
                  <ShinyButton
                    onClick={handleGenerate}
                    disabled={!description.trim() || isLoading}
                    className="w-full sm:w-auto min-h-11"
                  >
                    {isLoading ? "Loading…" : "Generate names →"}
                  </ShinyButton>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-4 font-medium tracking-wide">
                Press Enter to generate · No account needed · Free to use
              </p>
            </form>
          </main>
        </div>

        {/* Footer TLDs */}
        <footer
          className="hero-animate w-full pb-4 pb-safe px-4 sm:px-6 md:px-12 z-10 mt-auto shrink-0"
          style={{ animation: "fade-in 1s ease-out 1s backwards" }}
        >
          <div className="max-w-2xl mx-auto mb-4 p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg backdrop-blur-sm text-center">
            <p className="text-xs text-gray-300 font-medium tracking-wide uppercase mb-1.5">
              Smart Availability Routing
            </p>
            {/* max-w-prose caps the description line length */}
            <p className="text-xs text-gray-400 leading-relaxed max-w-prose mx-auto">
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
          </div>
        </footer>
      </div>
    </>
  )
}
