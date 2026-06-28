import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

let _serviceClient: ReturnType<typeof createSupabaseClient> | null = null

/**
 * Supabase client using the service role key.
 *
 * USE ONLY server-side (Route Handlers, Server Actions, lib/).
 * Never import this in any "use client" file.
 * Bypasses Row Level Security — needed for cache writes.
 */
export function getServiceClient() {
  if (!_serviceClient) {
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      // Fallback: if service key not set, return null so callers can degrade gracefully
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY not set — required for cache writes",
      )
    }
    _serviceClient = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }
  return _serviceClient
}
