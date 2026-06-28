import { z } from "zod"
import { AvailabilityStatusSchema } from "./domain"

// ─── Watchlist Item (extended) ────────────────────────────────────────────────

export const WatchlistItemSchema = z.object({
  id: z.string(),
  domain: z.string(),
  status: AvailabilityStatusSchema,
  score: z.number().min(0).max(100),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  alert_enabled: z.boolean().default(true),
  priceEstimate: z.string().nullable(),
  priceHistory: z.array(z.number()), // sparkline data
  socialX: z.string().nullable(),    // @handle or null
  socialIg: z.string().nullable(),   // @handle or null
  socialXAvailable: z.boolean().nullable(),
  socialIgAvailable: z.boolean().nullable(),
  checkingNow: z.boolean().default(false),
})
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalDomains: number
  availableNow: number
  inWatchlist: number
  avgScore: number
  totalDelta: number    // change from last week
  availableDelta: number
}

// ─── Activity Event ───────────────────────────────────────────────────────────

export const ActivityEventTypeSchema = z.enum([
  "status_changed",
  "domain_saved",
  "domain_removed",
  "domain_generated",
  "check_completed",
  "price_changed",
])
export type ActivityEventType = z.infer<typeof ActivityEventTypeSchema>

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  domain: string
  message: string
  timestamp: string
  meta?: {
    fromStatus?: string
    toStatus?: string
    oldPrice?: string
    newPrice?: string
  }
}

// ─── Insight Data ─────────────────────────────────────────────────────────────

export interface AvailabilityTrend {
  date: string
  available: number
  taken: number
}

export interface ScoreDistribution {
  range: string
  count: number
}

// ─── Quick Generation ─────────────────────────────────────────────────────────

export const QuickGenerateSchema = z.object({
  keywords: z.string().min(3).max(200),
})
export type QuickGenerate = z.infer<typeof QuickGenerateSchema>
