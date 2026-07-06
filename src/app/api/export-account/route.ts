import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settings?.plan !== 'pro') {
      return NextResponse.json({ error: "Pro plan required to export data." }, { status: 403 })
    }

    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
      },
      settings,
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
