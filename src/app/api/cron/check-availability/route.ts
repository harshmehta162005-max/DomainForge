import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { Resend } from "resend"
import * as React from "react"
import { AvailabilityAlertEmail } from "@/emails/AvailabilityAlertEmail"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

// Time map to calculate elapsed milliseconds
const INTERVAL_MAP: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
}

export async function GET(request: Request) {
  // 1. Authenticate the cron request
  const authHeader = request.headers.get("authorization")
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  // 2. Fetch all users who have Pro plan and auto_check enabled
  const { data: usersSettings, error: settingsError } = await supabase
    .from("user_settings")
    .select("user_id, check_interval, notif_available, notif_expiry, notif_price")
    .eq("auto_check", true)
    .eq("plan", "pro")

  if (settingsError || !usersSettings) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }

  const results = { checked: 0, alerted: 0, errors: 0 }

  // 3. Process each user's watchlist
  for (const user of usersSettings) {
    const intervalMs = INTERVAL_MAP[user.check_interval || "6h"] || INTERVAL_MAP["6h"]
    const cutoffTime = new Date(Date.now() - intervalMs).toISOString()

    // Fetch domains that are due for a check
    const { data: watchlist, error: watchError } = await supabase
      .from("watchlist")
      .select("id, domain, status, last_checked_at")
      .eq("user_id", user.user_id)
      .eq("alert_enabled", true)
      // Only check domains that haven't been checked recently OR never checked
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoffTime}`)

    if (watchError || !watchlist || watchlist.length === 0) continue

    const domainsToCheck = watchlist.map((w) => w.domain)
    
    // Check availability in batches
    const availabilityResults = await checkDomainsAvailability(domainsToCheck, 5, 
      domainsToCheck.map(d => ({ domain: d, isPrimary: false, forceRefresh: true }))
    )

    // Process results
    for (const item of watchlist) {
      const checkResult = availabilityResults.get(item.domain)
      if (!checkResult) {
        results.errors++
        continue
      }
      
      results.checked++
      
      let newStatus = item.status
      let emailSent = false

      // Check if status changed from taken to available
      if (item.status !== "available" && checkResult.status === "available") {
        newStatus = "available"
        
        // Send email if enabled
        if (user.notif_available && resend) {
          // Get user email
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
          if (authUser?.user?.email) {
            const firstName = authUser.user.email.split("@")[0].split(".")[0]
            const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
            
            try {
              await resend.emails.send({
                from: "DomainForge Alerts <alerts@domainforge.ai>",
                to: authUser.user.email,
                subject: `🚨 ${item.domain} is now AVAILABLE!`,
                react: React.createElement(AvailabilityAlertEmail, {
                  userName,
                  domain: item.domain,
                  appUrl: env.NEXT_PUBLIC_APP_URL
                })
              })
              emailSent = true
              results.alerted++
              
              // Log activity
              await supabase.from("activity_history").insert({
                user_id: user.user_id,
                domain: item.domain,
                event_type: "status_changed",
                note: `Domain became available! Alert sent.`
              })
            } catch (err) {
              console.error("Failed to send alert email", err)
            }
          }
        }
      }

      // Update the watchlist record
      const updatePayload: any = {
        last_checked_at: new Date().toISOString(),
        status: checkResult.status
      }
      
      if (emailSent) {
        updatePayload.last_alerted_at = new Date().toISOString()
      }

      await supabase
        .from("watchlist")
        .update(updatePayload)
        .eq("id", item.id)
    }
  }

  return NextResponse.json({ success: true, ...results })
}
