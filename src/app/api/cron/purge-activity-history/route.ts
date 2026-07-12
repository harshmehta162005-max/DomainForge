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

// Retain activity history for 90 days — anything older is deleted.
// This satisfies GDPR's "storage limitation" principle (Art. 5(1)(e)).
const RETENTION_DAYS = 90

export async function GET(request: Request) {
  // Authenticate the cron request
  const authHeader = request.headers.get("authorization")
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()

    const { count, error } = await supabaseAdmin
      .from("activity_history")
      .delete({ count: "exact" })
      .lt("created_at", cutoff)

    if (error) throw error

    return NextResponse.json({
      success: true,
      deleted: count ?? 0,
      cutoff,
      retention_days: RETENTION_DAYS,
    })
  } catch (error) {
    console.error("Activity history purge error:", error)
    return NextResponse.json(
      { error: "Purge failed. Check server logs." },
      { status: 500 }
    )
  }
}
