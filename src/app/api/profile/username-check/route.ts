import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// ─── GET /api/profile/username-check?username=xyz ────────────────────────────

const QuerySchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({ username: searchParams.get("username") })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username format" }, { status: 400 })
  }

  const { username } = parsed.data

  const { data: existing } = await supabase
    .from("user_settings")
    .select("user_id")
    .ilike("username", username)
    .neq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({ available: !existing })
}
