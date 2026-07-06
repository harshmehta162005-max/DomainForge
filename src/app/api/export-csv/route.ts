import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (settings?.plan !== 'pro') {
      return NextResponse.json({ error: "Pro plan required to export data." }, { status: 403 })
    }

    let domains: Array<Record<string, unknown>> = []

    const contentType = req.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = await req.json() as { domains: Array<Record<string, unknown>> }
      domains = body.domains ?? []
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const raw = formData.get("domains")
      if (typeof raw === "string") domains = JSON.parse(raw)
    }

    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({ error: "No data" }, { status: 400 })
    }

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }

    const headers = ["Domain", "Status", "Score", "Style", "TLD", "Explanation", "Buy Link"]
    const rows = [
      headers.map(escape).join(","),
      ...domains.map(s => [
        s.domain,
        s.availabilityStatus,
        s.score,
        s.style,
        s.tld,
        s.explanation,
        (s.registrarLinks as Record<string, string>)?.namecheap ?? "",
      ].map(escape).join(",")),
    ]

    const csv = "\uFEFF" + rows.join("\r\n")
    const date = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="domainforge-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

