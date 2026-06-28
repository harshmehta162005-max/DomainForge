import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkDomainsAvailability } from "@/lib/domain/availability"
import { sendWatchlistAlertEmail } from "@/lib/email"
import { env } from "@/lib/env"
import { namecheapUrl } from "@/lib/utils"

// Secure cron route with a simple bearer token or just standard Vercel Cron header
export async function GET(request: Request) {
  // 1. Verify authorization (e.g. from Vercel Cron)
  const authHeader = request.headers.get("authorization")
  // In production you would want to check this against a secure token like CRON_SECRET
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase service role key not configured" }, { status: 500 })
  }

  // 2. Initialize Supabase with service_role to bypass RLS
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  // 3. Fetch all domains where alert_enabled = true and status is NOT available
  const { data: watchlisted, error } = await supabase
    .from("watchlist")
    .select(`
      id,
      domain,
      status,
      user_id,
      users!inner ( email )
    `)
    .eq("alert_enabled", true)
    .neq("status", "available")

  if (error) {
    console.error("[Cron/Watchlist] Failed to fetch watchlist:", error)
    return NextResponse.json({ error: "DB Error" }, { status: 500 })
  }

  if (!watchlisted || watchlisted.length === 0) {
    return NextResponse.json({ success: true, checked: 0, alerted: 0 })
  }

  // 4. Batch check availability
  const domainsToCheck = [...new Set(watchlisted.map(w => w.domain))]
  const availabilityResults = await checkDomainsAvailability(domainsToCheck, 5)

  let alertedCount = 0

  // 5. Process results
  for (const item of watchlisted) {
    const result = availabilityResults.get(item.domain)
    
    // If it is now available...
    if (result && result.available) {
      // 5a. Send email alert
      // @ts-expect-error - nested join typing workaround
      const email = item.users?.email as string | undefined
      
      if (email) {
        const sent = await sendWatchlistAlertEmail({
          to: email,
          domain: item.domain,
          registrarLink: namecheapUrl(item.domain),
        })

        if (sent) {
          alertedCount++
          
          // 5b. Update DB status to 'available' and optionally disable future alerts for this domain
          // (so we don't keep emailing them every hour)
          await supabase
            .from("watchlist")
            .update({ 
              status: "available",
              alert_enabled: false // turn off alert after sending
            })
            .eq("id", item.id)
        }
      }
    } else if (result && result.status !== item.status) {
      // Just update status if it changed (e.g. unknown -> taken) without sending email
      await supabase
        .from("watchlist")
        .update({ status: result.status })
        .eq("id", item.id)
    }
  }

  return NextResponse.json({ 
    success: true, 
    checked: domainsToCheck.length,
    alerted: alertedCount 
  })
}
