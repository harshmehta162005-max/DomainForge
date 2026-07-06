import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { env } from "@/lib/env"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { DomainAlertEmail } from "@/emails/DomainAlertEmail"
import * as React from "react"

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

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (
    env.CRON_SECRET &&
    authHeader !== `Bearer ${env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: watchlistEntries, error: watchlistError } = await supabaseAdmin
      .from("watchlist")
      .select("id, domain, status, user_id, expires_at, last_alerted_at, price_estimate, alert_enabled, notify_frequency, notification_preferences")
      .eq("alert_enabled", true)

    if (watchlistError) throw watchlistError
    if (!watchlistEntries || watchlistEntries.length === 0) {
      return NextResponse.json({ message: "No active alerts to check." })
    }

    const uniqueDomains = Array.from(new Set(watchlistEntries.map((e) => e.domain)))
    const availabilityResults = await checkDomainsAvailability(uniqueDomains, 5)

    const userIds = Array.from(new Set(watchlistEntries.map((e) => e.user_id)))
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    const userMap = new Map<string, string>()
    if (!usersError && usersData?.users) {
      usersData.users.forEach(u => {
        if (u.email) userMap.set(u.id, u.email)
      })
    }

    const updates = []
    const emailsToSend: any[] = []
    const now = new Date()

    for (const entry of watchlistEntries) {
      const result = availabilityResults.get(entry.domain)
      if (!result) continue

      let shouldAlert = false
      let alertType: "available" | "expiring" | "price_drop" = "available"
      let extraData = ""
      let newAlertEnabled = entry.alert_enabled

      // Safely parse preferences
      const prefs = entry.notification_preferences || { availability: true, expiration: true, price_drop: true }
      
      const lastAlerted = entry.last_alerted_at ? new Date(entry.last_alerted_at) : null
      const daysSinceLastAlert = lastAlerted 
        ? (now.getTime() - lastAlerted.getTime()) / (1000 * 3600 * 24) 
        : Infinity

      // Rate limit based on notify_frequency
      const minDaysBetweenAlerts = entry.notify_frequency === 'weekly' ? 7 : (entry.notify_frequency === 'daily' ? 1 : 0)
      
      if (daysSinceLastAlert < minDaysBetweenAlerts) {
        // Skip alerting if we are within the frequency throttle, EXCEPT for availability which is immediate and high priority
        if (!(entry.status !== "available" && result.status === "available" && prefs.availability)) {
           continue
        }
      }

      // Condition A: Became available
      if (prefs.availability && entry.status !== "available" && result.status === "available") {
        shouldAlert = true
        alertType = "available"
        newAlertEnabled = false
      }
      // Condition B: Price Drop (simulated here since availability API might not return price, but if we had an aftermarket API hooked up)
      else if (prefs.price_drop && entry.price_estimate && result.status === "taken") {
         // Placeholder for price drop logic if `result` contained price.
         // e.g. if (result.price < parseFloat(entry.price_estimate) * 0.9)
      }
      // Condition C: Expiring soon (30, 15, 7, 3 days)
      else if (prefs.expiration && result.status === "taken" && result.expiresAt) {
        const expiresAtDate = new Date(result.expiresAt)
        const daysUntilExpiry = Math.floor((expiresAtDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        
        // Only alert exactly on or near these thresholds if we haven't alerted in the last few days
        if ([30, 15, 7, 3].some(threshold => daysUntilExpiry <= threshold && daysUntilExpiry > threshold - 2)) {
          // ensure we haven't already sent a recent alert
          if (daysSinceLastAlert > 3) {
            shouldAlert = true
            alertType = "expiring"
            extraData = daysUntilExpiry.toString()
          }
        }
      }

      const needsDbUpdate = 
        entry.status !== result.status || 
        entry.expires_at !== result.expiresAt || 
        shouldAlert ||
        newAlertEnabled !== entry.alert_enabled

      if (needsDbUpdate) {
        updates.push(
          supabaseAdmin
            .from("watchlist")
            .update({
              status: result.status,
              expires_at: result.expiresAt || null,
              ...(shouldAlert ? { last_alerted_at: now.toISOString(), alert_enabled: newAlertEnabled } : {})
            })
            .eq("id", entry.id)
        )
      }

      if (shouldAlert && resend) {
        const email = userMap.get(entry.user_id)
        if (email) {
          emailsToSend.push({
            from: "DomainForge Alerts <alerts@domainforge.ai>",
            to: email,
            subject: alertType === "available" 
              ? `🎉 ${entry.domain} is now available!` 
              : (alertType === "expiring" ? `⏰ ${entry.domain} expires in ${extraData} days` : `💰 Price drop for ${entry.domain}`),
            react: React.createElement(DomainAlertEmail, {
              domain: entry.domain,
              alertType,
              extraData,
              appUrl: env.NEXT_PUBLIC_APP_URL
            })
          })
        }
      }
    }

    await Promise.all(updates)
    
    if (emailsToSend.length > 0 && resend) {
      await resend.batch.send(emailsToSend)
    }

    return NextResponse.json({
      success: true,
      checked: watchlistEntries.length,
      alertsSent: emailsToSend.length,
    })
  } catch (error: any) {
    console.error("Cron Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
