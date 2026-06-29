import { NextResponse } from "next/server"
import { z } from "zod"
import type { SocialHandles } from "@/types/domain"

const SocialCheckRequestSchema = z.object({
  domain: z.string(),
  baseName: z.string(),
})

/**
 * Social handle availability check.
 *
 * NOTE ON RELIABILITY:
 * Public social platforms (X, Instagram) aggressively block/redirect HEAD
 * requests from server IPs, making it nearly impossible to reliably determine
 * handle availability via HTTP probing.
 *
 * Current strategy: attempt a short-timeout HEAD request. X and Instagram
 * both return 200 for almost everything (login redirect, existing profile).
 * Only a definitive 404 is treated as "available". Everything else is "unknown".
 *
 * For production: use a social handle availability API (e.g. Namecheckr,
 * Brandfetch, or a custom browser-based checker).
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = SocialCheckRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  }

  const { baseName } = parsed.data
  const handle = baseName.toLowerCase().replace(/[^a-z0-9_]/g, "")

  // Only trust 404 as "available" — anything else (200, 301, 403, timeout)
  // is treated as "unknown" to avoid false "taken" signals.
  const checkPlatform = async (url: string) => {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DomainForge/2.0)",
        },
        signal: AbortSignal.timeout(3000),
        redirect: "manual", // Don't follow redirects — treat them as unknown
      })
      // A genuine 404 means the profile page doesn't exist → available
      if (res.status === 404) return "available" as const
      // Anything else (200 for existing profile OR login redirect) → unknown
      return "unknown" as const
    } catch {
      return "unknown" as const
    }
  }

  const [twitterStatus, instagramStatus] = await Promise.all([
    checkPlatform(`https://x.com/${handle}`),
    checkPlatform(`https://instagram.com/${handle}`),
  ])

  const response: SocialHandles = {
    twitter: { handle: `@${handle}`, status: twitterStatus },
    instagram: { handle: `@${handle}`, status: instagramStatus },
  }

  return NextResponse.json(response)
}
