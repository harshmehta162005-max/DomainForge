"use client"

import { useState, useCallback } from "react"
import type { DomainSuggestion } from "@/types/domain"

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeneratePhase =
  | "idle"
  | "generating"   // Groq LLM in progress
  | "checking"     // RDAP availability in progress
  | "done"
  | "error"

export interface GenerateState {
  phase: GeneratePhase
  suggestions: DomainSuggestion[]
  error: string | null
  totalGenerated: number
  fallbackTriggered: boolean
}

export interface GenerateOptions {
  businessDescription: string
  categories?: string[]
  targetAudience?: string
  problemSolved?: string
  tonePreset?: "playful" | "corporate" | "minimal" | "bold" | "technical"
  preferences?: {
    modern?: number
    cool?: number
    professional?: number
    short?: number
    memorable?: number
    brandable?: number
    length?: "short" | "medium" | "long"
  }
  tlds?: string[]
  count?: number
  maxLength?: number
  excludeWords?: string[]
  namingStyles?: string[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGenerate() {
  const [state, setState] = useState<GenerateState>({
    phase: "idle",
    suggestions: [],
    error: null,
    totalGenerated: 0,
    fallbackTriggered: false,
  })

  const generate = useCallback(async (options: GenerateOptions) => {
    if (!options.businessDescription?.trim()) return

    setState({ phase: "generating", suggestions: [], error: null, totalGenerated: 0, fallbackTriggered: false })

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      })

      // Transition to "checking" phase once we have the response
      // (RDAP checks happen server-side, but we show the phase change)
      setState((prev) => ({ ...prev, phase: "checking" }))

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Request failed" }))
        throw new Error(errData.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()

      setState({
        phase: "done",
        suggestions: data.suggestions ?? [],
        error: null,
        totalGenerated: data.metadata?.totalGenerated ?? 0,
        fallbackTriggered: data.metadata?.fallbackTriggered ?? false,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Generation failed"
      setState((prev) => ({
        ...prev,
        phase: "error",
        error: message,
      }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ phase: "idle", suggestions: [], error: null, totalGenerated: 0, fallbackTriggered: false })
  }, [])

  return { ...state, generate, reset }
}
