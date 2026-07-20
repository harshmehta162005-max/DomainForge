"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, Wand2, ChevronDown, ChevronUp, LayoutDashboard, SlidersHorizontal, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useGenerate } from "@/hooks/use-generate"
import type { DomainSuggestion } from "@/types/domain"
import { TONE_PRESET_SLIDERS, type TonePreset } from "@/types/domain"
import {
  PromptBox,
  CategoryPicker,
  StyleSliders,
  AdvancedOptions,
  TonePresets,
} from "@/components/generator/StudioControls"
import { GenerateButton } from "@/components/generator/GenerateButton"
import { ResultsArea } from "@/components/generator/ResultsArea"
import { RightPanel } from "@/components/generator/RightPanel"
import { ProUpgradeDialog } from "@/components/ui/ProUpgradeDialog"

// ─── Session state shape ──────────────────────────────────────────────────────

interface SliderValues {
  modern: number
  professional: number
  brandable: number
  short: number
}

interface SessionState {
  description: string
  categories: string[]
  targetAudience: string
  tonePreset: TonePreset | undefined
  sliders: SliderValues
  tlds: string[]
  namingStyles: string[]
  maxLength: number
  count: number
  excludeWords: string[]
}

const DEFAULT_STATE: SessionState = {
  description: "",
  categories: ["Tech"],
  targetAudience: "",
  tonePreset: "bold",
  sliders: TONE_PRESET_SLIDERS.bold,
  tlds: [".com", ".io", ".ai"],
  namingStyles: [],
  maxLength: 12,
  count: 10,
  excludeWords: [],
}

const LS_KEY = "df_generator_session"

function loadSession(): SessionState {
  if (typeof window === "undefined") return DEFAULT_STATE
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<SessionState>
    return { ...DEFAULT_STATE, ...parsed, description: "" }
  } catch {
    return DEFAULT_STATE
  }
}

function saveSession(state: SessionState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    // quota exceeded — silently ignore
  }
}

// ─── Generator page ───────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const [session, setSession] = useState<SessionState>(DEFAULT_STATE)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [shortlist, setShortlist] = useState<DomainSuggestion[]>([])
  const [proDialogOpen, setProDialogOpen] = useState(false)
  const hasLoaded = useRef(false)

  const { phase, suggestions, error, generate, reset, fallbackTriggered } = useGenerate()

  useEffect(() => {
    if (!hasLoaded.current) {
      setSession(loadSession())
      hasLoaded.current = true
    }
  }, [])

  useEffect(() => {
    if (hasLoaded.current) {
      saveSession(session)
    }
  }, [session])

  const updateSession = useCallback(<K extends keyof SessionState>(key: K, value: SessionState[K]) => {
    setSession(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSlider = useCallback((key: keyof SliderValues, value: number) => {
    setSession(prev => ({ ...prev, sliders: { ...prev.sliders, [key]: value } }))
  }, [])

  const updateTonePreset = useCallback((preset: string) => {
    setSession(prev => {
      const p = preset as TonePreset | undefined
      if (!p) return { ...prev, tonePreset: undefined }
      const newSliders = TONE_PRESET_SLIDERS[p]
      if (newSliders) {
        return { ...prev, tonePreset: p, sliders: newSliders }
      }
      return prev
    })
  }, [])

  const handleGenerate = useCallback(() => {
    const desc = session.description.trim()
    if (!desc || desc.length < 2) return

    generate({
      businessDescription: desc,
      categories: session.categories.length > 0 ? session.categories : ["General"],
      targetAudience: session.targetAudience || "startups and entrepreneurs",
      // Derive problemSolved from the description so the LLM always gets real context
      // instead of the generic default "building a new online presence"
      problemSolved: desc,
      tonePreset: session.tonePreset,
      preferences: session.sliders,
      tlds: session.tlds.length > 0 ? session.tlds : [".com", ".io", ".ai"],
      count: session.count,
      maxLength: session.maxLength,
      excludeWords: session.excludeWords,
      namingStyles: session.namingStyles,
    })
  }, [session, generate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleGenerate])

  const handleShortlist = useCallback(async (s: DomainSuggestion) => {
    const exists = shortlist.some(p => p.domain === s.domain)

    // Optimistic update
    setShortlist(prev =>
      exists ? prev.filter(p => p.domain !== s.domain) : [...prev, s]
    )

    try {
      const res = await fetch("/api/shortlist", {
        method: exists ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          exists
            ? { domain: s.domain }
            : { domain: s.domain, status: s.availabilityStatus }
        ),
      })

      if (res.status === 403) {
        // Revert optimistic update and show Pro dialog
        setShortlist(prev =>
          exists ? [...prev, s] : prev.filter(p => p.domain !== s.domain)
        )
        setProDialogOpen(true)
      } else if (!res.ok) {
        // Revert optimistic update on other errors
        setShortlist(prev =>
          exists ? [...prev, s] : prev.filter(p => p.domain !== s.domain)
        )
      }
    } catch {
      // Revert on network error
      setShortlist(prev =>
        exists ? [...prev, s] : prev.filter(p => p.domain !== s.domain)
      )
    }
  }, [shortlist])

  const handleWatchlist = useCallback((_s: DomainSuggestion) => {
    // toast handled inside DomainResultCard
  }, [])

  const handlePickPrompt = useCallback((prompt: string) => {
    updateSession("description", prompt)
    setSidebarOpen(true)
  }, [updateSession])

  const isGenerating = phase === "generating" || phase === "checking"
  const canGenerate = session.description.trim().length >= 2

  return (
    <>
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors duration-150"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-sm hidden sm:block">Back</span>
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-cyan-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-zinc-100">Name generator</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase indicator */}
          {phase !== "idle" && (
            <span className={cn(
              "text-xs font-mono px-2 py-1 rounded-[4px] border",
              isGenerating
                ? "bg-cyan-950/40 border-cyan-900 text-cyan-400 animate-pulse"
                : phase === "done"
                  ? "bg-green-950/40 border-green-900 text-green-400"
                  : phase === "error"
                    ? "bg-red-950/40 border-red-900 text-red-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
            )}>
              {phase === "generating" ? "Generating…"
                : phase === "checking" ? "Checking availability…"
                  : phase === "done" ? `${suggestions.length} results`
                    : "Error"}
            </span>
          )}

          <Link
            href="/dashboard"
            className="h-8 px-3 flex items-center gap-1.5 rounded-[4px] bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors duration-150"
          >
            <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:block">Dashboard</span>
          </Link>

          <button
            onClick={() => {
              if (isGenerating) {
                reset()
              } else {
                setSidebarOpen(p => !p)
              }
            }}
            className="h-8 w-8 flex items-center justify-center rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors duration-150 lg:hidden"
          >
            {isGenerating ? <X className="h-4 w-4 text-red-400" strokeWidth={1.5} /> : <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Studio sidebar ─────────────────────────────────────────────── */}
        <aside className={cn(
          "flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto overflow-x-hidden",
          "transition-all duration-200 ease-out",
          "hidden lg:flex lg:flex-col",
          sidebarOpen ? "lg:w-80 xl:w-96" : "lg:w-0 lg:overflow-hidden lg:border-0",
        )}>
          <div className="p-4 space-y-5 min-w-[20rem]">
            {/* Description */}
            <PromptBox
              value={session.description}
              onChange={v => updateSession("description", v)}
            />

            {/* Categories */}
            <CategoryPicker
              selected={session.categories}
              onChange={v => updateSession("categories", v)}
            />

            {/* Target audience */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Target audience
              </label>
              <input
                type="text"
                value={session.targetAudience}
                onChange={e => updateSession("targetAudience", e.target.value)}
                placeholder="Remote teams, freelancers, enterprises…"
                className="w-full h-9 px-3 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
              />
            </div>

            {/* Tone presets */}
            <TonePresets
              selected={session.tonePreset}
              onChange={updateTonePreset}
            />

            {/* Advanced options (collapsible) */}
            <div className="border-t border-zinc-800 pt-4">
              <button
                onClick={() => setAdvancedOpen(p => !p)}
                className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 uppercase tracking-wider hover:text-zinc-200 transition-colors duration-150"
              >
                <span>Advanced options</span>
                {advancedOpen
                  ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                  : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                }
              </button>
              {advancedOpen && (
                <div className="space-y-5 mt-4">
                  <StyleSliders
                    values={session.sliders}
                    onChange={(k, v) => {
                      updateSlider(k, v)
                      updateSession("tonePreset", undefined) // custom slider breaks preset
                    }}
                  />
                  <AdvancedOptions
                    tlds={session.tlds}
                    onTldsChange={v => updateSession("tlds", v)}
                    namingStyles={session.namingStyles}
                    onNamingStylesChange={v => updateSession("namingStyles", v)}
                    maxLength={session.maxLength}
                    onMaxLengthChange={v => updateSession("maxLength", v)}
                    excludeWords={session.excludeWords}
                    onExcludeWordsChange={v => updateSession("excludeWords", v)}
                    count={session.count}
                    onCountChange={v => updateSession("count", v)}
                  />
                </div>
              )}
            </div>

            {/* Sticky generate button */}
            <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800">
              <GenerateButton
                onClick={handleGenerate}
                loading={isGenerating}
                phase={phase}
                disabled={!canGenerate}
              />
              {error && (
                <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
              )}
              <p className="text-[10px] text-zinc-500 text-center mt-3 px-2 leading-tight">
                DomainForge never registers, resells, or shares the names you search for.
              </p>
              <p className="text-[9px] text-zinc-600 text-center mt-1 px-2 leading-tight">
                We may earn an affiliate commission on domain purchases.
              </p>
              <p className="text-[10px] text-zinc-700 text-center mt-1">
                Ctrl+Enter to generate
              </p>
            </div>
          </div>
        </aside>

        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="hidden lg:flex items-center justify-center w-6 bg-zinc-950 hover:bg-zinc-900 border-r border-zinc-800 text-zinc-500 hover:text-cyan-400 transition-colors duration-150 flex-shrink-0"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen
            ? <ChevronDown className="h-4 w-4 -rotate-90" strokeWidth={1.5} />
            : <ChevronDown className="h-4 w-4 rotate-90" strokeWidth={1.5} />
          }
        </button>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <RightPanel
            phase={phase}
            suggestions={suggestions}
            shortlist={shortlist}
            onShortlist={handleShortlist}
            categories={session.categories}
            description={session.description}
            onPickPrompt={handlePickPrompt}
            fallbackTriggered={fallbackTriggered}
          >
            <ResultsArea
              suggestions={suggestions}
              phase={phase}
              shortlist={shortlist}
              onShortlist={handleShortlist}
              onWatchlist={handleWatchlist}
              hideIdleState
            />
          </RightPanel>
        </main>
      </div>

      {/* ── Mobile: full space sidebar ──────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden absolute top-14 inset-x-0 bottom-0 z-30 bg-zinc-950 overflow-y-auto pb-6">
          <div className="p-4 space-y-5">
            <PromptBox
              value={session.description}
              onChange={v => updateSession("description", v)}
            />
            <CategoryPicker
              selected={session.categories}
              onChange={v => updateSession("categories", v)}
            />
            
            {/* Target audience */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Target audience
              </label>
              <input
                type="text"
                value={session.targetAudience}
                onChange={e => updateSession("targetAudience", e.target.value)}
                placeholder="Remote teams, freelancers, enterprises…"
                className="w-full h-9 px-3 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
              />
            </div>

            <TonePresets
              selected={session.tonePreset}
              onChange={updateTonePreset}
            />

            {/* Advanced options */}
            <div className="border-t border-zinc-800 pt-4">
              <button
                onClick={() => setAdvancedOpen(p => !p)}
                className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 uppercase tracking-wider hover:text-zinc-200 transition-colors duration-150"
              >
                <span>Advanced options</span>
                {advancedOpen
                  ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                  : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                }
              </button>
              {advancedOpen && (
                <div className="space-y-5 mt-4">
                  <StyleSliders
                    values={session.sliders}
                    onChange={(k, v) => {
                      updateSlider(k, v)
                      updateSession("tonePreset", undefined)
                    }}
                  />
                  <AdvancedOptions
                    tlds={session.tlds}
                    onTldsChange={v => updateSession("tlds", v)}
                    namingStyles={session.namingStyles}
                    onNamingStylesChange={v => updateSession("namingStyles", v)}
                    maxLength={session.maxLength}
                    onMaxLengthChange={v => updateSession("maxLength", v)}
                    excludeWords={session.excludeWords}
                    onExcludeWordsChange={v => updateSession("excludeWords", v)}
                    count={session.count}
                    onCountChange={v => updateSession("count", v)}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <GenerateButton
                onClick={() => { handleGenerate(); setSidebarOpen(false) }}
                loading={isGenerating}
                phase={phase}
                disabled={!canGenerate}
              />
              <p className="text-[10px] text-zinc-500 text-center mt-3 px-2 leading-tight">
                DomainForge never registers, resells, or shares the names you search for.
              </p>
              <p className="text-[9px] text-zinc-600 text-center mt-1 px-2 leading-tight">
                We may earn an affiliate commission on domain purchases.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    <ProUpgradeDialog
      open={proDialogOpen}
      onOpenChange={setProDialogOpen}
      featureName="Shortlist"
    />
  </>  
  )
}
