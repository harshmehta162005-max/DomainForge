"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Tech", "SaaS", "AI / ML", "Fintech", "E-commerce",
  "Health", "Education", "Productivity", "Developer Tools",
  "Social", "Marketplace", "Security", "Media", "B2B",
] as const

const EXAMPLE_PROMPTS = [
  "AI-powered task management for remote teams",
  "Freelance invoice and contract platform",
  "Crypto portfolio tracker with tax reports",
  "Mental health app for working professionals",
  "B2B SaaS for HR document automation",
]

// ─── PromptBox ────────────────────────────────────────────────────────────────

interface PromptBoxProps {
  value: string
  onChange: (v: string) => void
}

export function PromptBox({ value, onChange }: PromptBoxProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Describe your project
      </label>
      <textarea
        id="generator-prompt"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="AI-powered task management tool for remote teams that reduces meeting fatigue…"
        rows={4}
        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-[4px] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors duration-150 leading-relaxed"
      />
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_PROMPTS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="text-xs px-2 py-1 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors duration-150"
          >
            {p.length > 32 ? p.slice(0, 32) + "…" : p}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── CategoryPicker ───────────────────────────────────────────────────────────

interface CategoryPickerProps {
  selected: string[]
  onChange: (cats: string[]) => void
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  const toggle = (cat: string) => {
    onChange(selected.includes(cat) ? selected.filter(c => c !== cat) : [...selected, cat])
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Category
      </label>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => {
          const active = selected.includes(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-[4px] border font-medium transition-all duration-100",
                active
                  ? "bg-cyan-950/70 border-cyan-800 text-cyan-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── TonePresets ─────────────────────────────────────────────────────────────

interface TonePresetsProps {
  selected?: string
  onChange: (tone: string) => void
}

const TONES = ["playful", "corporate", "minimal", "bold", "technical"]

export function TonePresets({ selected, onChange }: TonePresetsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Tone
      </label>
      <div className="flex flex-wrap gap-1.5">
        {TONES.map(tone => {
          const active = selected === tone
          return (
            <button
              key={tone}
              type="button"
              onClick={() => onChange(active ? "" : tone)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-[4px] border font-medium capitalize transition-all duration-100",
                active
                  ? "bg-cyan-950/70 border-cyan-800 text-cyan-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              {tone}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── StyleSliders ─────────────────────────────────────────────────────────────

const SLIDERS = [
  { key: "modern" as const,       label: "Modern",      low: "Classic",  high: "Futuristic" },
  { key: "professional" as const, label: "Tone",        low: "Playful",  high: "Corporate"  },
  { key: "brandable" as const,    label: "Brandability",low: "Literal",  high: "Abstract"   },
  { key: "short" as const,        label: "Length",      low: "Long",     high: "Short"      },
] as const

type SliderKey = typeof SLIDERS[number]["key"]

interface StyleSliderValues {
  modern: number
  professional: number
  brandable: number
  short: number
}

interface StyleSlidersProps {
  values: StyleSliderValues
  onChange: (key: SliderKey, value: number) => void
}

export function StyleSliders({ values, onChange }: StyleSlidersProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Style
      </label>
      {SLIDERS.map(({ key, label, low, high }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300">{label}</span>
            <span className="text-xs font-mono text-zinc-600 tabular-nums">{values[key]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-700 w-12 text-right shrink-0">{low}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={values[key]}
              onChange={e => onChange(key, Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-zinc-800 rounded-full outline-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs text-zinc-700 w-12 shrink-0">{high}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── AdvancedOptions ──────────────────────────────────────────────────────────

const TLD_OPTIONS = [".com", ".io", ".ai", ".co", ".app", ".dev", ".net", ".xyz", ".gg", ".sh"] as const
const NAMING_STYLES = ["Brandable", "Compound", "Invented", "Portmanteau", "Keyword"] as const

interface AdvancedOptionsProps {
  tlds: string[]
  onTldsChange: (tlds: string[]) => void
  namingStyles: string[]
  onNamingStylesChange: (styles: string[]) => void
  maxLength: number
  onMaxLengthChange: (v: number) => void
  excludeWords: string[]
  onExcludeWordsChange: (words: string[]) => void
  count: number
  onCountChange: (v: number) => void
}

export function AdvancedOptions({
  tlds, onTldsChange,
  namingStyles, onNamingStylesChange,
  maxLength, onMaxLengthChange,
  excludeWords, onExcludeWordsChange,
  count, onCountChange,
}: AdvancedOptionsProps) {
  const [excludeInput, setExcludeInput] = useState("")

  const toggleTld = (tld: string) => {
    onTldsChange(tlds.includes(tld) ? tlds.filter(t => t !== tld) : [...tlds, tld])
  }
  const toggleStyle = (style: string) => {
    onNamingStylesChange(namingStyles.includes(style) ? namingStyles.filter(s => s !== style) : [...namingStyles, style])
  }
  const addExclude = () => {
    const w = excludeInput.trim().toLowerCase()
    if (w && !excludeWords.includes(w)) {
      onExcludeWordsChange([...excludeWords, w])
      setExcludeInput("")
    }
  }

  return (
    <div className="space-y-4 pt-1">
      {/* TLDs */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Extensions (TLDs)</label>
        <div className="flex flex-wrap gap-1.5">
          {TLD_OPTIONS.map(tld => (
            <button
              key={tld}
              type="button"
              onClick={() => toggleTld(tld)}
              className={cn(
                "font-mono text-xs px-2 py-1 rounded-[4px] border transition-all duration-100",
                tlds.includes(tld)
                  ? "bg-cyan-950/70 border-cyan-800 text-cyan-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              {tld}
            </button>
          ))}
        </div>
      </div>

      {/* Naming styles */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Naming Style</label>
        <div className="flex flex-wrap gap-1.5">
          {NAMING_STYLES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStyle(s)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-[4px] border transition-all duration-100",
                namingStyles.includes(s)
                  ? "bg-cyan-950/70 border-cyan-800 text-cyan-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Count + Max length */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs text-zinc-400">Count</label>
          <div className="flex items-center h-8 bg-zinc-950 border border-zinc-700 rounded-[4px] focus-within:border-zinc-500 transition-colors">
            <button
              type="button"
              onClick={() => onCountChange(Math.max(5, count - 1))}
              className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min={5}
              max={20}
              value={count}
              onChange={e => onCountChange(Math.min(20, Math.max(5, Number(e.target.value))))}
              className="flex-1 w-full h-full bg-transparent text-sm text-zinc-100 font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onCountChange(Math.min(20, count + 1))}
              className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-zinc-400">Max length</label>
          <div className="flex items-center h-8 bg-zinc-950 border border-zinc-700 rounded-[4px] focus-within:border-zinc-500 transition-colors">
            <button
              type="button"
              onClick={() => onMaxLengthChange(Math.max(4, maxLength - 1))}
              className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min={4}
              max={20}
              value={maxLength}
              onChange={e => onMaxLengthChange(Math.min(20, Math.max(4, Number(e.target.value))))}
              className="flex-1 w-full h-full bg-transparent text-sm text-zinc-100 font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => onMaxLengthChange(Math.min(20, maxLength + 1))}
              className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Exclude words */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Exclude words</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={excludeInput}
            onChange={e => setExcludeInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addExclude()}
            placeholder="word to avoid…"
            className="flex-1 h-8 px-2.5 bg-zinc-950 border border-zinc-700 rounded-[4px] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            type="button"
            onClick={addExclude}
            className="h-8 px-3 bg-zinc-800 border border-zinc-700 rounded-[4px] text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            Add
          </button>
        </div>
        {excludeWords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {excludeWords.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => onExcludeWordsChange(excludeWords.filter(x => x !== w))}
                className="text-xs px-2 py-0.5 rounded-[4px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900 transition-colors font-mono"
              >
                {w} ×
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── end ─────────────────────────────────────────────────────────────────────
