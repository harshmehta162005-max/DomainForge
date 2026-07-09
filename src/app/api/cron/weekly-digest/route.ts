import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { Resend } from "resend"
import * as React from "react"
import { WeeklyDigestEmail } from "@/emails/WeeklyDigestEmail"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

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
  // 1. Authenticate the cron request
  const authHeader = request.headers.get("authorization")
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = supabaseAdmin

  // 2. Fetch all users who have weekly_digest enabled
  const { data: usersSettings, error: settingsError } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("weekly_digest", true)
    .eq("notif_master", true)

  if (settingsError || !usersSettings) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }

  const results = { sent: 0, errors: 0 }

  // 3. Process each user
  for (const user of usersSettings) {
    // Get user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.user_id)
    if (!authUser?.user?.email) continue

    // Get watchlist stats
    const { data: watchlist } = await supabase
      .from("watchlist")
      .select("status, expires_at, created_at")
      .eq("user_id", user.user_id)
      
    if (!watchlist || watchlist.length === 0) continue

    const now = new Date()
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const last7DaysIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Query activity_history for status_changed events in the past 7 days
    const { count: recentActivityCount } = await supabase
      .from("activity_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.user_id)
      .eq("event_type", "status_changed")
      .gte("created_at", last7DaysIso)

    const stats = {
      total: watchlist.length,
      available: watchlist.filter(w => w.status === "available").length,
      expiringSoon: watchlist.filter(w => w.expires_at && new Date(w.expires_at) < next30Days && new Date(w.expires_at) > now).length,
      recentlyChanged: recentActivityCount ?? 0
    }


    if (resend) {
      const firstName = authUser.user.email.split("@")[0].split(".")[0]
      const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
      
      try {
        await resend.emails.send({
          from: "DomainForge Digest <digest@domainforge.ai>",
          to: authUser.user.email,
          subject: "Your Weekly DomainForge Digest",
          react: React.createElement(WeeklyDigestEmail, {
            userName,
            stats,
            appUrl: env.NEXT_PUBLIC_APP_URL
          })
        })
        results.sent++
      } catch (err) {
        console.error("Failed to send digest email", err)
        results.errors++
      }
    }
  }

  return NextResponse.json({ success: true, ...results })
}
