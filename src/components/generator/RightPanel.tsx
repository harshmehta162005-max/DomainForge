"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Copy, Check, Star, ExternalLink, Zap, Lightbulb,
  ChevronDown, ChevronUp, TrendingUp, Target, Layers,
  Globe, Brain, ShoppingCart, Heart, Wand2,
} from "lucide-react"
import { RegistrarDropdown } from "@/components/domain/RegistrarDropdown"
import type { DomainSuggestion } from "@/types/domain"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

// ─── Animation presets ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" as const } },
}

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}

// ─── Category accent colors ───────────────────────────────────────────────────

const CATEGORY_ACCENTS: Record<string, string> = {
  "Tech":            "from-cyan-950/50 to-zinc-950",
  "AI / ML":         "from-cyan-950/40 to-zinc-950",
  "SaaS":            "from-zinc-900/60 to-zinc-950",
  "Fintech":         "from-green-950/35 to-zinc-950",
  "E-commerce":      "from-orange-950/25 to-zinc-950",
  "Health":          "from-green-950/25 to-zinc-950",
  "Education":       "from-cyan-950/25 to-zinc-950",
  "Productivity":    "from-zinc-800/40 to-zinc-950",
  "Developer Tools": "from-cyan-950/50 to-zinc-950",
  "Security":        "from-orange-950/35 to-zinc-950",
  "Marketplace":     "from-orange-950/25 to-zinc-950",
  "Media":           "from-zinc-800/40 to-zinc-950",
  "Social":          "from-cyan-950/25 to-zinc-950",
  "B2B":             "from-zinc-900/60 to-zinc-950",
}

// ─── Dot-grid SVG background ──────────────────────────────────────────────────

function DotGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#27272a" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  )
}

// ─── Logo mockup ──────────────────────────────────────────────────────────────

function LogoMockup({ name }: { name: string }) {
  const a = name.slice(0, 1).toUpperCase()
  const b = name.slice(1, 2).toLowerCase()
  return (
    <div className="w-14 h-14 flex-shrink-0 rounded-[6px] bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
      <span className="font-mono font-bold text-2xl text-zinc-100 leading-none tracking-tight select-none">
        {a}<span className="text-cyan-400">{b}</span>
      </span>
    </div>
  )
}

// ─── Availability badge ───────────────────────────────────────────────────────

function HeroBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string; dot: string }> = {
    available: { cls: "bg-green-950 border-green-800 text-green-400", label: "Available", dot: "bg-green-400" },
    taken:     { cls: "bg-red-950 border-red-800 text-red-400",       label: "Taken",     dot: "bg-red-400"   },
    premium:   { cls: "bg-orange-950 border-orange-800 text-orange-400", label: "Premium", dot: "bg-orange-400" },
    unknown:   { cls: "bg-zinc-800 border-zinc-700 text-zinc-400",    label: "Unknown",   dot: "bg-zinc-500"  },
  }
  const c = cfg[status] ?? cfg.unknown
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-sm font-medium", c.cls)}
    >
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", c.dot, status === "available" && "animate-pulse")} />
      {c.label}
    </motion.span>
  )
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ suggestion }: { suggestion: DomainSuggestion }) {
  const { score, scoreBreakdown } = suggestion
  const r = 20
  const circ = 2 * Math.PI * r
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#22d3ee" : "#71717a"
  return (
    <div className="group/hero relative w-14 h-14 flex items-center justify-center flex-shrink-0 cursor-help">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
        <motion.circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <span className="text-xs font-mono font-bold text-zinc-200 z-10">{score}</span>
      
      {/* Tooltip */}
      {scoreBreakdown && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl opacity-0 group-hover/hero:opacity-100 pointer-events-none transition-opacity duration-150 z-20 text-xs text-left">
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-zinc-400">Brandability</span><span className="text-zinc-200 font-mono">{scoreBreakdown.brandability}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Typeability</span><span className="text-zinc-200 font-mono">{scoreBreakdown.typeability}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Relevance</span><span className="text-zinc-200 font-mono">{scoreBreakdown.keywordRelevance}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">TLD Trust</span><span className="text-zinc-200 font-mono">{scoreBreakdown.tldTrust}</span></div>
          </div>
          {/* Triangle */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-px border-4 border-transparent border-b-zinc-700" />
        </div>
      )}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function GenerationProgressBar({ phase }: { phase: string }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (phase === "generating") {
      setPct(0)
      const t1 = setTimeout(() => setPct(30), 300)
      const t2 = setTimeout(() => setPct(52), 1600)
      const t3 = setTimeout(() => setPct(68), 3200)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
    if (phase === "checking") { setPct(82); const t = setTimeout(() => setPct(93), 1000); return () => clearTimeout(t) }
    if (phase === "done")     setPct(100)
    if (phase === "idle")     setPct(0)
  }, [phase])

  if (phase === "idle" || phase === "error") return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-mono">
          {phase === "generating" ? "Crafting creative names…" : phase === "checking" ? "Checking availability…" : "Done"}
        </span>
        <span className="text-xs font-mono text-zinc-600 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-cyan-400 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// ─── Hero domain (top of results) ────────────────────────────────────────────

interface HeroDomainProps {
  suggestion: DomainSuggestion
  isShortlisted: boolean
  onShortlist: (s: DomainSuggestion) => void
  onFirstShortlist: () => void
}

function HeroDomain({ suggestion, isShortlisted, onShortlist, onFirstShortlist }: HeroDomainProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(suggestion.domain).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleShortlist = () => {
    onShortlist(suggestion)
    if (!isShortlisted) onFirstShortlist()
  }

  return (
    <motion.div
      key={suggestion.domain}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="flex items-start gap-4">
        <LogoMockup name={suggestion.baseName} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-mono text-2xl font-bold text-zinc-50 tracking-tight leading-none">
              {suggestion.domain}
            </h2>
            <HeroBadge status={suggestion.availabilityStatus} />
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing suggestion={suggestion} />
            <div>
              <p className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wider font-medium">AI Score</p>
              <p className="text-xs text-zinc-400 capitalize">{suggestion.style} · {suggestion.tld}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-3">
        {suggestion.explanation}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleShortlist}
          className={cn(
            "h-9 px-4 flex items-center gap-2 rounded-[4px] text-sm font-medium transition-all duration-150 active:scale-[0.98]",
            isShortlisted
              ? "bg-cyan-950/60 border border-cyan-800 text-cyan-400"
              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600"
          )}
        >
          <Star className="h-3.5 w-3.5" strokeWidth={1.5} fill={isShortlisted ? "currentColor" : "none"} />
          {isShortlisted ? "Shortlisted" : "Add to shortlist"}
        </button>

        <RegistrarDropdown
          suggestion={suggestion}
          className="h-9 px-4 text-sm gap-2"
          variant="primary"
        />

        <button
          onClick={copy}
          className="h-9 px-3 flex items-center gap-1.5 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-200 text-sm transition-colors duration-150"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Inspiration cards (idle state) ──────────────────────────────────────────

const INSPIRATION_CARDS = [
  {
    icon: Brain,
    title: "AI task manager",
    desc: "AI-powered task management for remote teams that reduces meeting fatigue",
    tld: ".ai",
  },
  {
    icon: Zap,
    title: "Freelance invoicing",
    desc: "Freelance invoice and contract platform with automatic follow-ups",
    tld: ".co",
  },
  {
    icon: TrendingUp,
    title: "Crypto analytics",
    desc: "Crypto portfolio tracker with tax reporting and DeFi insights",
    tld: ".io",
  },
  {
    icon: Heart,
    title: "Mental health app",
    desc: "Mental health app for working professionals with guided sessions",
    tld: ".app",
  },
] as const

// ─── Constants ────────────────────────────────────────────────────────────────

const TRENDING_TLDS = [
  { tld: ".ai",  note: "↑ 340% YoY" },
  { tld: ".io",  note: "Dev favorite" },
  { tld: ".dev", note: "Google-owned" },
  { tld: ".app", note: "Consumer" },
  { tld: ".co",  note: "Startup go-to" },
  { tld: ".sh",  note: "CLI tools" },
]

const TIPS = [
  { icon: Target, text: "Be specific — \"AI invoice tool for freelancers\" beats \"finance app\"" },
  { icon: Layers, text: "Short brandable names (5–8 chars) outperform keyword domains" },
  { icon: Globe,  text: "Invented words like Figma or Zapier age better than keywords" },
]

// ─── Floating domains background ─────────────────────────────────────────────

const FLOATING_TLDS = [
  { tld: ".com", left: "15%", duration: 12, delay: 0 },
  { tld: ".io", left: "80%", duration: 14, delay: 2 },
  { tld: ".ai", left: "25%", duration: 10, delay: 5 },
  { tld: ".co", left: "70%", duration: 15, delay: 1 },
  { tld: ".app", left: "40%", duration: 13, delay: 4 },
  { tld: ".dev", left: "60%", duration: 11, delay: 7 },
  { tld: ".net", left: "10%", duration: 16, delay: 3 },
  { tld: ".tech", left: "90%", duration: 12, delay: 6 },
  { tld: ".xyz", left: "50%", duration: 14, delay: 8 },
]

function FloatingDomains() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {FLOATING_TLDS.map((item, i) => (
        <motion.div
          key={i}
          className="absolute font-mono font-bold text-lg text-cyan-400/40 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          style={{ left: item.left, top: -50 }}
          animate={{
            y: [0, 1200],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear",
          }}
        >
          {item.tld}
        </motion.div>
      ))}
    </div>
  )
}

interface IdleStateProps {
  onPickPrompt: (p: string) => void
  categories: string[]
}

function IdleState({ onPickPrompt, categories }: IdleStateProps) {
  const primaryCat = categories[0] ?? "Tech"
  const accentGradient = CATEGORY_ACCENTS[primaryCat] ?? CATEGORY_ACCENTS["Tech"]

  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full overflow-y-auto overflow-x-hidden relative"
    >
      {/* Dot-grid background */}
      <DotGrid />

      {/* Floating domain extensions */}
      <FloatingDomains />

      {/* Category-driven gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-b pointer-events-none", accentGradient)} />

      <div className="relative z-10 flex flex-col min-h-full">

        {/* ── Hero text ───────────────────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center px-8 pt-12 pb-8"
        >
          {/* Creative Logo */}
          <motion.div variants={fadeUp} className="mb-6 relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
            <div className="relative w-16 h-16 bg-zinc-900 border border-zinc-700/50 rounded-2xl flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-2xl" />
              <Wand2 className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-2xl font-semibold text-zinc-100 leading-tight tracking-tight mb-3 max-w-sm"
          >
            The perfect name is one<br />
            <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">generate</span> away.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="hidden sm:block text-sm text-zinc-400 leading-relaxed max-w-xs"
          >
            Describe your project on the left. Let AI craft creative, available
            domain names tailored to your vision.
          </motion.p>

          <motion.p variants={fadeUp} className="hidden sm:block text-xs text-zinc-600 mt-4 font-mono">
            Ctrl+Enter to generate
          </motion.p>
        </motion.div>

        {/* ── Inspiration cards ────────────────────────────────────────────── */}
        <div className="px-5 pb-6">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3 px-1">
            Try an example
          </p>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-2.5"
          >
            {INSPIRATION_CARDS.map(({ icon: Icon, title, desc, tld }) => (
              <motion.button
                key={title}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15, ease: "easeOut" } }}
                onClick={() => onPickPrompt(desc)}
                className={cn(
                  "group relative p-4 bg-zinc-900 border border-zinc-800 rounded-[4px] text-left",
                  "hover:border-cyan-400/40 hover:bg-zinc-800/80 transition-colors duration-150",
                  "flex flex-col gap-2"
                )}
              >
                {/* TLD pill */}
                <span className="absolute top-3 right-3 font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-zinc-800 border border-zinc-700 text-zinc-600 group-hover:border-cyan-900 group-hover:text-cyan-600 transition-colors duration-150">
                  {tld}
                </span>

                <Icon className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400 transition-colors duration-150" strokeWidth={1.5} />

                <div>
                  <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors duration-150 mb-0.5">
                    {title}
                  </p>
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{desc}</p>
                </div>

                <span className="text-[11px] text-zinc-700 group-hover:text-cyan-400/70 transition-colors duration-150 flex items-center gap-1 mt-auto">
                  Try this
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 5h6M5.5 2.5 8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── Trust & tips ─────────────────────────────────────────────────── */}
        <div className="mt-auto border-t border-zinc-800/60 px-5 pt-5 pb-6 space-y-4">

          {/* Trending TLDs */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" strokeWidth={1.5} />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Trending TLDs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TLDS.map(({ tld, note }) => (
                <div key={tld} className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-[4px]">
                  <span className="font-mono text-xs font-medium text-zinc-300">{tld}</span>
                  <span className="text-[10px] text-zinc-700">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Lightbulb className="h-3.5 w-3.5 text-cyan-400/70" strokeWidth={1.5} />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Quick tips</span>
            </div>
            <div className="space-y-2">
              {TIPS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 text-zinc-700 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-zinc-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState({ phase }: { phase: string }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full p-6 gap-5"
    >
      <GenerationProgressBar phase={phase} />

      {/* Preview skeleton rows */}
      <div className="space-y-3 mt-2">
        {[80, 62, 70, 55, 66].map((w, i) => (
          <div
            key={i}
            className="h-3.5 bg-zinc-800/70 rounded-[2px] animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-4 space-y-2.5 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-zinc-800 rounded-[2px]" />
              <div className="h-4 w-14 bg-zinc-800 rounded-[2px]" />
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
            <div className="space-y-1">
              <div className="h-3 w-full bg-zinc-800 rounded-[2px]" />
              <div className="h-3 w-3/4 bg-zinc-800 rounded-[2px]" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Smart helper (shown below hero when results exist) ───────────────────────

interface SmartHelperProps {
  categories: string[]
  description: string
}

function SmartHelper({ categories, description }: SmartHelperProps) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const primaryCat = categories[0] ?? "Tech"
  const hasTech = categories.some(c => ["Tech", "SaaS", "AI / ML", "Developer Tools"].includes(c))

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* AI Insight */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-cyan-400" strokeWidth={1.5} />
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">AI insight</span>
        </div>
        {description.trim().length > 10 ? (
          <p className="text-xs text-zinc-500 leading-relaxed">
            Based on your description, <span className="text-zinc-300">{primaryCat}</span> audiences respond best to{" "}
            <span className="text-zinc-300">
              {hasTech ? "short, invented names with .ai or .io TLDs" : "memorable, brandable names that evoke the core value"}
            </span>. Consider names under 8 characters.
          </p>
        ) : (
          <p className="text-xs text-zinc-600 leading-relaxed">
            Fill in your project description to get personalized naming insights.
          </p>
        )}
      </div>

      {/* Trending TLDs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-green-400" strokeWidth={1.5} />
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Trending TLDs</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_TLDS.map(({ tld }) => (
            <span key={tld} className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-zinc-800 border border-zinc-700 text-zinc-400">{tld}</span>
          ))}
        </div>
        <p className="text-xs text-zinc-700">.ai registrations up 340% YoY. .io remains #1 for dev tools.</p>
      </div>

      {/* Naming tips */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[4px] overflow-hidden">
        <button
          onClick={() => setTipsOpen(p => !p)}
          className="flex items-center justify-between w-full p-3 text-left hover:bg-zinc-800/50 transition-colors duration-150"
        >
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Naming principles</span>
          </div>
          {tipsOpen
            ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
            : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" strokeWidth={1.5} />
          }
        </button>
        <AnimatePresence>
          {tipsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden border-t border-zinc-800"
            >
              <div className="p-3 space-y-2">
                {TIPS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-xs text-zinc-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

interface RightPanelProps {
  phase: string
  suggestions: DomainSuggestion[]
  shortlist: DomainSuggestion[]
  onShortlist: (s: DomainSuggestion) => void
  categories: string[]
  description: string
  onPickPrompt: (p: string) => void
  fallbackTriggered?: boolean
  children: ReactNode
}

export function RightPanel({
  phase,
  suggestions,
  shortlist,
  onShortlist,
  categories,
  description,
  onPickPrompt,
  fallbackTriggered,
  children,
}: RightPanelProps) {
  const isLoading    = phase === "generating" || phase === "checking"
  const hasSuggestions = suggestions.length > 0 && !isLoading
  const hero         = suggestions.find(s => s.availabilityStatus === "available") ?? suggestions[0]
  const isHeroShortlisted = shortlist.some(s => s.domain === hero?.domain)

  const primaryCat     = categories[0] ?? "Tech"
  const accentGradient = CATEGORY_ACCENTS[primaryCat] ?? CATEGORY_ACCENTS["Tech"]

  // Confetti on first shortlist
  const confettiRef = useRef(false)
  const handleFirstShortlist = () => {
    if (!confettiRef.current && shortlist.length === 0) {
      confettiRef.current = true
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.45 },
        colors: ["#22d3ee", "#4ade80", "#f4f4f5"],
        gravity: 1.2,
        scalar: 0.85,
      })
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-zinc-950">
      <AnimatePresence mode="wait">

        {/* ── IDLE ──────────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <IdleState key="idle" onPickPrompt={onPickPrompt} categories={categories} />
        )}

        {/* ── LOADING ────────────────────────────────────────────────────── */}
        {isLoading && (
          <LoadingState key="loading" phase={phase} />
        )}

        {/* ── ERROR ──────────────────────────────────────────────────────── */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-8 py-16"
          >
            <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900 flex items-center justify-center mb-4">
              <span className="text-red-400 text-lg font-mono font-bold">!</span>
            </div>
            <p className="text-sm text-red-400 mb-2 font-medium">Generation failed</p>
            <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
              Refine your description and try again. A shorter, more specific prompt works best.
            </p>
          </motion.div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {hasSuggestions && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full min-h-0 overflow-hidden"
          >
            {/* Hero domain — top section */}
            {hero && (
              <div className="flex-shrink-0 border-b border-zinc-800 relative overflow-hidden">
                <div className={cn("absolute inset-0 bg-gradient-to-b pointer-events-none", accentGradient)} />
                <DotGrid />
                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Best match</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs text-zinc-700 font-mono">{suggestions.length} generated</span>
                  </div>
                  <HeroDomain
                    suggestion={hero}
                    isShortlisted={isHeroShortlisted}
                    onShortlist={onShortlist}
                    onFirstShortlist={handleFirstShortlist}
                  />
                  {fallbackTriggered && (
                    <div className="mt-4 p-2 bg-yellow-950/30 border border-yellow-900/50 rounded-[4px] flex items-center justify-center gap-2 text-yellow-400/80">
                      <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="text-xs font-medium">We expanded your filters to find these names.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results grid — bottom section */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {children}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
