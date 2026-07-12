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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the current HH:MM time string in a given IANA timezone. */
function currentTimeInTz(timezone: string): string {
  try {
    return new Date().toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).slice(0, 5)
  } catch {
    return new Date().toISOString().slice(11, 16)
  }
}

/**
 * Returns true if current time falls inside the quiet window [start, end).
 * Handles overnight windows, e.g. start="22:00" end="08:00".
 */
function isInQuietHours(start: string, end: string, timezone: string): boolean {
  const now = currentTimeInTz(timezone)
  if (start > end) {
    // Overnight: 22:00–08:00 → quiet if now >= 22:00 OR now < 08:00
    return now >= start || now < end
  }
  return now >= start && now < end
}

interface UserGlobalSettings {
  notif_master:        boolean
  notif_available:     boolean
  notif_expiry:        boolean
  notif_price:         boolean
  notif_frequency:     string
  quiet_hours_enabled: boolean
  quiet_hours_start:   string
  quiet_hours_end:     string
  timezone:            string
}

// ── Cron handler ──────────────────────────────────────────────────────────────

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

    const { data: shortlistEntries, error: shortlistError } = await supabaseAdmin
      .from("shortlist")
      .select("id, domain, status, user_id, expires_at, last_alerted_at, alert_enabled")
      .eq("alert_enabled", true)

    if (shortlistError) throw shortlistError

    const combinedEntries = [
      ...(watchlistEntries || []).map(e => ({ ...e, type: "watchlist" as const })),
      ...(shortlistEntries || []).map(e => ({
        ...e,
        type: "shortlist" as const,
        price_estimate: null,
        notify_frequency: "immediate",
        notification_preferences: { availability: true, expiration: true, price_drop: false }
      }))
    ]

    if (combinedEntries.length === 0) {
      return NextResponse.json({ message: "No active alerts to check." })
    }

    const uniqueDomains = Array.from(new Set(combinedEntries.map((e) => e.domain)))
    const availabilityResults = await checkDomainsAvailability(uniqueDomains, 5)

    // ── Fetch global user settings for all relevant users in one query ──
    const userIds = Array.from(new Set(combinedEntries.map((e) => e.user_id)))

    const { data: userSettingsRows } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, notif_master, notif_available, notif_expiry, notif_price, notif_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone")
      .in("user_id", userIds)

    const userSettingsMap = new Map<string, UserGlobalSettings>()
    for (const row of (userSettingsRows ?? [])) {
      userSettingsMap.set(row.user_id as string, {
        notif_master:        (row.notif_master        as boolean) ?? true,
        notif_available:     (row.notif_available     as boolean) ?? true,
        notif_expiry:        (row.notif_expiry        as boolean) ?? true,
        notif_price:         (row.notif_price         as boolean) ?? false,
        notif_frequency:     (row.notif_frequency     as string)  ?? "immediate",
        quiet_hours_enabled: (row.quiet_hours_enabled as boolean) ?? false,
        quiet_hours_start:   (row.quiet_hours_start   as string)  ?? "22:00",
        quiet_hours_end:     (row.quiet_hours_end     as string)  ?? "08:00",
        timezone:            (row.timezone            as string)  ?? "UTC",
      })
    }

    // ── Fetch user emails ──
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    const userEmailMap = new Map<string, string>()
    if (!usersError && usersData?.users) {
      usersData.users.forEach(u => {
        if (u.email) userEmailMap.set(u.id, u.email)
      })
    }

    const updates: Promise<unknown>[] = []
    const emailsToSend: unknown[] = []
    const now = new Date()

    for (const entry of combinedEntries) {
      const result = availabilityResults.get(entry.domain)
      if (!result) continue

      const globalPrefs = userSettingsMap.get(entry.user_id)

      let shouldAlert = false
      let alertType: "available" | "expiring" | "price_drop" = "available"
      let extraData = ""
      let newAlertEnabled = entry.alert_enabled

      const domainPrefs = entry.notification_preferences || { availability: true, expiration: true, price_drop: true }
      
      const lastAlerted = entry.last_alerted_at ? new Date(entry.last_alerted_at) : null
      const daysSinceLastAlert = lastAlerted 
        ? (now.getTime() - lastAlerted.getTime()) / (1000 * 3600 * 24) 
        : Infinity

      const minDaysBetweenAlerts = entry.notify_frequency === "weekly" ? 7 : (entry.notify_frequency === "daily" ? 1 : 0)
      
      if (daysSinceLastAlert < minDaysBetweenAlerts) {
        if (!(entry.status !== "available" && result.status === "available" && domainPrefs.availability)) {
           continue
        }
      }

      // Condition A: Became available
      if (domainPrefs.availability && entry.status !== "available" && result.status === "available") {
        shouldAlert = true
        alertType = "available"
        newAlertEnabled = false
      }
      // Condition C: Expiring soon
      else if (domainPrefs.expiration && result.status === "taken" && (result.expiresAt || entry.expires_at)) {
        const expiresAtDate = new Date((result.expiresAt ?? entry.expires_at) as string)
        const daysUntilExpiry = Math.floor((expiresAtDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        if ([30, 15, 7, 3].some(threshold => daysUntilExpiry <= threshold && daysUntilExpiry > threshold - 2)) {
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
          Promise.resolve(
            supabaseAdmin
              .from(entry.type === "shortlist" ? "shortlist" : "watchlist")
              .update({
                status: result.status,
                expires_at: result.expiresAt || null,
                ...(shouldAlert ? { last_alerted_at: now.toISOString(), alert_enabled: newAlertEnabled } : {})
              })
              .eq("id", entry.id)
          )
        )
      }
      
      // ── Always write in-app notification (unaffected by email gates) ──
      if (shouldAlert) {
        updates.push(
          Promise.resolve(
            supabaseAdmin
              .from("activity_history")
              .insert({
                user_id: entry.user_id,
                domain: entry.domain,
                event_type: alertType === "available" ? "status_changed" : alertType,
                note: alertType === "available" 
                  ? `${entry.domain} is now available!` 
                  : (alertType === "expiring" ? `${entry.domain} expires in ${extraData} days` : `Price drop detected for ${entry.domain}`),
                is_read: false
              })
          )
        )
      }

      // ── Gate email on global user settings ──
      if (!shouldAlert || !resend) continue

      const g = globalPrefs

      // 1. Master toggle off → skip email (in-app already written)
      if (g && !g.notif_master) continue

      // 2. Global alert type flags
      if (g) {
        if (alertType === "available" && !g.notif_available) continue
        if (alertType === "expiring"  && !g.notif_expiry)    continue
        // price_drop is a valid alertType but won't equal "available"|"expiring"
        if (!g.notif_price && alertType !== "available" && alertType !== "expiring") continue
      }

      // 3. Quiet hours → skip email silently (Option A), in-app already saved
      if (g?.quiet_hours_enabled && isInQuietHours(g.quiet_hours_start, g.quiet_hours_end, g.timezone)) {
        continue
      }

      // 4. Global frequency: only "immediate" sends now.
      //    Exception: domain-became-available is always immediate (time-sensitive).
      if (g && g.notif_frequency !== "immediate" && alertType !== "available") continue

      const email = userEmailMap.get(entry.user_id)
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

    await Promise.all(updates)
    
    if (emailsToSend.length > 0 && resend) {
      await resend.batch.send(emailsToSend as Parameters<typeof resend.batch.send>[0])
    }

    return NextResponse.json({
      success: true,
      checked: combinedEntries.length,
      alertsSent: emailsToSend.length,
    })
  } catch (error: unknown) {
    console.error("Cron Error:", error)
    return NextResponse.json({ error: "Cron job failed. Check server logs." }, { status: 500 })
  }
}
