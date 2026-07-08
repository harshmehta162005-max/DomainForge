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
  SUPABASE_SERVICE_ROLE_KEY: optionalStr,

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
  CRON_SECRET: optionalStr,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
})

export type Env = z.infer<typeof EnvSchema>

// ─── Validate at import time ───────────────────────────────────────────────────

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:")
  console.error(parsed.error.flatten().fieldErrors)
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables — check .env.local")
  }
}

export const env = parsed.success ? parsed.data : ({} as Env)
