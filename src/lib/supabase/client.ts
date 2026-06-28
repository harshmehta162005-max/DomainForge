import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase client for use in Client Components ("use client").
 * Uses process.env directly — avoids importing the full server-side
 * env schema (which includes GROQ_API_KEY etc. that are undefined in browser).
 * NEXT_PUBLIC_* vars are always available on the client.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(url, key)
}
