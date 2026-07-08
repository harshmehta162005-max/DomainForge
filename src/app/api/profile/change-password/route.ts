import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const ChangePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or less"),
  confirmPassword: z.string(),
})

// ─── POST /api/profile/change-password ────────────────────────────────────────

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

  const parsed = ChangePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    )
  }

  const { newPassword, confirmPassword } = parsed.data

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  // Supabase uses the session cookie to authenticate the update — no need to
  // re-enter current password when a valid session is present.
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to update password" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: "Password updated successfully." })
}
