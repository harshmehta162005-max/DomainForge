import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    const { count: domainCount, error: domainError } = await supabaseAdmin
      .from("domain_cache")
      .delete({ count: "exact" })
      .lt("expires_at", now)

    if (domainError) throw domainError

    const { count: genCount, error: genError } = await supabaseAdmin
      .from("generation_cache")
      .delete({ count: "exact" })
      .lt("expires_at", now)

    if (genError) throw genError

    return NextResponse.json({
      success: true,
      deleted: {
        domain_cache: domainCount ?? 0,
        generation_cache: genCount ?? 0,
      },
    })
  } catch (error: any) {
    console.error("Cache cleanup error:", error)
    return NextResponse.json({ error: "Cache cleanup failed. Check server logs." }, { status: 500 })
  }
}
