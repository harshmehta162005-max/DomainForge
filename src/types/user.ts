import { z } from "zod"

export const UserSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  marketing_emails: z.boolean().default(false),
  weekly_digest: z.boolean().default(true),
  security_alerts: z.boolean().default(true),
  notif_available: z.boolean().default(true),
  notif_expiry: z.boolean().default(true),
  notif_price: z.boolean().default(false),
  default_tlds: z.string().default(".com,.io,.ai"),
  auto_check: z.boolean().default(false),
  check_interval: z.string().default("6h"),
  plan: z.string().default("free"),
  // Profile fields (added via 20260709000001_profile_fields.sql)
  display_name: z.string().max(50).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(160).nullable().optional(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/).nullable().optional(),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>

// ─── Profile (merged: auth user + user_settings) ──────────────────────────────

export const ProfileSchema = z.object({
  // From Supabase Auth
  email: z.string().email(),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable(),
  provider: z.string(), // e.g. "email", "google", "github"
  // From user_settings
  plan: z.string().default("free"),
  display_name: z.string().max(50).nullable(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().max(160).nullable(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/).nullable(),
  // Notifications
  notif_available: z.boolean(),
  notif_expiry: z.boolean(),
  notif_price: z.boolean(),
  weekly_digest: z.boolean(),
  // Stats (injected by the profile API)
  watchlist_count: z.number(),
  shortlist_count: z.number(),
  generation_count: z.number(),
})

export type Profile = z.infer<typeof ProfileSchema>

// Zod schema for username validation (reusable)
export const UsernameSchema = z
  .string()
  .min(3, "Must be at least 3 characters")
  .max(20, "Must be 20 characters or less")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed")
