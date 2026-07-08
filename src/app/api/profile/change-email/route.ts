import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const ChangeEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
})

// ─── POST /api/profile/change-email ──────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = ChangeEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    )
  }

  if (parsed.data.email === user.email) {
    return NextResponse.json(
      { error: "New email must differ from current email" },
      { status: 400 }
    )
  }

  // Supabase sends a verification email to the new address automatically.
  // The change takes effect only after the user clicks the link.
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email })

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to send verification email" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: `A verification link has been sent to ${parsed.data.email}. Your email will update once you confirm it.`,
  })
}
