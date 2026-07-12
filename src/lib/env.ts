import { z } from "zod"

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Next.js passes empty env vars as "" not undefined — these preprocessors fix that.

const optionalStr = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().min(1).optional(),
)

const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().url().optional(),
)

// ─── Schema ───────────────────────────────────────────────────────────────────

export const EnvSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Service role key is required — used by account deletion, cron jobs, billing, and notifications.
  // Without it these features silently fail or 500 at runtime.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Groq (required)
  GROQ_API_KEY: z.string().min(1),

  // Domain availability APIs (optional — RDAP fallback used without them)
  DOMSCAN_API_KEY: optionalStr,
  WHOISFREAKS_API_KEY: optionalStr,

  // Resend API (optional — needed for watchlist email alerts)
  RESEND_API_KEY: optionalStr,

  // MarkerAPI — real USPTO trademark lookup (optional — AI-only fallback when not set)
  // Register free at https://markerapi.com (1,000 searches/month free)
  MARKERAPI_USERNAME: optionalStr,
  MARKERAPI_PASSWORD: optionalStr,

  // Upstash Redis (optional — Supabase cache table used as fallback)
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalStr,

  // App
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (v === "" ? "http://localhost:3000" : v),
    z.string().url().default("http://localhost:3000"),
  ),
  // Cron secret — required in production to protect cron endpoints from unauthenticated calls.
  CRON_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    process.env.NODE_ENV === "production"
      ? z.string().min(8, "CRON_SECRET must be at least 8 characters in production")
      : z.string().min(1).optional(),
  ),

  // Sentry error monitoring DSN
  // Safe to expose client-side — it's just the ingest endpoint, not an auth token.
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
})

export type Env = z.infer<typeof EnvSchema>

// ─── Validate at import time ───────────────────────────────────────────────────

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("\u274c Invalid environment variables:")
  console.error(parsed.error.flatten().fieldErrors)
  // Always throw — running with broken config causes confusing silent failures
  // that are much harder to debug than a clear startup error.
  throw new Error(
    "Invalid environment variables — fix the above errors before starting the app."
  )
}

export const env = parsed.data
