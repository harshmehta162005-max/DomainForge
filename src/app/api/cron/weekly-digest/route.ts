import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { env } from "@/lib/env"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { WeeklyDigestEmail, type DigestItem } from "@/emails/WeeklyDigestEmail"
import * as React from "react"

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Get all users who have weekly_digest enabled
    const { data: usersSettings, error: settingsErr } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, weekly_digest")
      .eq("weekly_digest", true)

    if (settingsErr) throw settingsErr
    if (!usersSettings || usersSettings.length === 0) {
      return NextResponse.json({ message: "No users opted into weekly digest." })
    }

    const optedInUserIds = usersSettings.map(s => s.user_id)

    // 2. Get all their active weekly watchlist entries
    const { data: watchlistEntries, error: watchlistError } = await supabaseAdmin
      .from("watchlist")
      .select("id, domain, status, user_id, expires_at, price_estimate, alert_enabled, notify_frequency, notification_preferences, score")
      .eq("alert_enabled", true)
      .in("user_id", optedInUserIds)

    if (watchlistError) throw watchlistError
    if (!watchlistEntries || watchlistEntries.length === 0) {
      return NextResponse.json({ message: "No active weekly alerts to check." })
    }

    const uniqueDomains = Array.from(new Set(watchlistEntries.map(e => e.domain)))
    const availabilityResults = await checkDomainsAvailability(uniqueDomains, 5)

    // Fetch user emails
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    const userMap = new Map<string, { email: string, name: string }>()
    if (!usersError && usersData?.users) {
      usersData.users.forEach(u => {
        if (u.email) {
          const name = u.email.split("@")[0].split(".")[0]
          userMap.set(u.id, { email: u.email, name: name.charAt(0).toUpperCase() + name.slice(1) })
        }
      })
    }

    const updates = []
    const emailsToSend: any[] = []
    const now = new Date()

    // Group items by user
    const userDigests = new Map<string, { newAvailable: DigestItem[], expiringSoon: DigestItem[], priceDrops: DigestItem[] }>()

    for (const entry of watchlistEntries) {
      const result = availabilityResults.get(entry.domain)
      if (!result) continue

      const prefs = entry.notification_preferences || { availability: true, expiration: true, price_drop: true }
      let includeInDigest = false
      let listKey: "newAvailable" | "expiringSoon" | "priceDrops" | null = null

      // Condition A: Became available
      if (prefs.availability && entry.status !== "available" && result.status === "available") {
        includeInDigest = true
        listKey = "newAvailable"
      }
      // Condition C: Expiring soon (within next 30 days total)
      else if (prefs.expiration && result.status === "taken" && result.expiresAt) {
        const expiresAtDate = new Date(result.expiresAt)
        const daysUntilExpiry = Math.floor((expiresAtDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          includeInDigest = true
          listKey = "expiringSoon"
        }
      }

      const needsDbUpdate = entry.status !== result.status || entry.expires_at !== result.expiresAt

      if (needsDbUpdate) {
        updates.push(
          supabaseAdmin
            .from("watchlist")
            .update({
              status: result.status,
              expires_at: result.expiresAt || null,
              ...(includeInDigest ? { last_alerted_at: now.toISOString() } : {}) // Update throttle
            })
            .eq("id", entry.id)
        )
      } else if (includeInDigest) {
        // Just update last_alerted_at if we're putting it in the digest
        updates.push(
          supabaseAdmin
            .from("watchlist")
            .update({ last_alerted_at: now.toISOString() })
            .eq("id", entry.id)
        )
      }

      if (includeInDigest && listKey) {
        if (!userDigests.has(entry.user_id)) {
          userDigests.set(entry.user_id, { newAvailable: [], expiringSoon: [], priceDrops: [] })
        }
        
        const digestItem: DigestItem = {
          domain: entry.domain,
          status: result.status,
          score: entry.score,
          expiresAt: result.expiresAt || null,
          priceEstimate: entry.price_estimate
        }
        userDigests.get(entry.user_id)![listKey].push(digestItem)
      }
    }

    await Promise.all(updates)

    for (const [userId, digest] of userDigests.entries()) {
      if (digest.newAvailable.length > 0 || digest.expiringSoon.length > 0 || digest.priceDrops.length > 0) {
        const user = userMap.get(userId)
        if (user && resend) {
          emailsToSend.push({
            from: "DomainForge Digest <digest@domainforge.ai>",
            to: user.email,
            subject: `Weekly Summary: ${digest.newAvailable.length} new domains available!`,
            react: React.createElement(WeeklyDigestEmail, {
              userName: user.name,
              appUrl: env.NEXT_PUBLIC_APP_URL,
              newAvailable: digest.newAvailable,
              expiringSoon: digest.expiringSoon,
              priceDrops: digest.priceDrops
            })
          })
        }
      }
    }
    
    if (emailsToSend.length > 0 && resend) {
      await resend.batch.send(emailsToSend)
    }

    return NextResponse.json({
      success: true,
      checked: watchlistEntries.length,
      digestsSent: emailsToSend.length,
    })
  } catch (error: any) {
    console.error("Weekly Digest Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
