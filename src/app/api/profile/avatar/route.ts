import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────
// Accepts multipart/form-data with a file field named "avatar"
// Uploads to Supabase Storage bucket "avatars" and saves URL to user_settings

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("avatar")
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 2 MB" }, { status: 400 })
  }

  // Use admin client to upload (bypasses storage RLS, uses service role)
  const supabaseAdmin = createAdminClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const ext = file.type.split("/")[1] ?? "jpg"
  const path = `${user.id}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    // Storage bucket may not exist yet — return helpful message
    return NextResponse.json(
      {
        error:
          uploadError.message.includes("not found") ||
          uploadError.message.includes("does not exist")
            ? "Avatar storage is not configured yet. Please set up the 'avatars' bucket in Supabase Storage."
            : "Failed to upload avatar",
      },
      { status: 500 }
    )
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(path)

  const avatarUrl = publicUrlData.publicUrl

  // Save avatar URL to user_settings
  const { error: dbError } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, avatar_url: avatarUrl }, { onConflict: "user_id" })

  if (dbError) {
    return NextResponse.json({ error: "Failed to save avatar URL" }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
