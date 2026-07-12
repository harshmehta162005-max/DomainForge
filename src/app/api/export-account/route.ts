import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Explicit field list — no select('*') on user data
    const { data: settings } = await supabase
      .from('user_settings')
      .select('plan, display_name, bio, username, notif_available, notif_expiry, notif_price, weekly_digest')
      .eq('user_id', user.id)
      .single()

    if (settings?.plan !== 'pro') {
      return NextResponse.json({ error: "Pro plan required to export data." }, { status: 403 })
    }

    // Explicit field list — never select('*') on user data tables
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('domain, status, score, tags, price_estimate, alert_enabled, notify_frequency, expires_at, created_at')
      .eq('user_id', user.id)

    const exportData = {
      user: {
        // email is user-facing; omit internal UUID (user.id) from the download
        email: user.email,
        created_at: user.created_at,
      },
      settings: {
        plan: settings.plan,
        display_name: settings.display_name ?? null,
        bio: settings.bio ?? null,
        username: settings.username ?? null,
        notif_available: settings.notif_available,
        notif_expiry: settings.notif_expiry,
        notif_price: settings.notif_price,
        weekly_digest: settings.weekly_digest,
      },
      watchlist: watchlist || [],
      exported_at: new Date().toISOString()
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const date = new Date().toISOString().slice(0, 10)

    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="domainforge-account-${date}.json"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Export account error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
