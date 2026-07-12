import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─── In-memory rate limiter (per-process, good enough for MVP) ────────────────
// In production with multiple instances, replace with Upstash Redis for
// cross-instance consistency.

interface RateLimitRecord {
  count: number
  windowStart: number
}

const rateLimits = new Map<string, RateLimitRecord>()

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimits.get(key)
  if (!record || now - record.windowStart > windowMs) {
    rateLimits.set(key, { count: 1, windowStart: now })
    return false
  }
  if (record.count >= max) return true
  record.count += 1
  return false
}

function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Too many requests. Please wait and try again.',
      code: 'RATE_LIMITED',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const pathname = request.nextUrl.pathname

  // ── Auth endpoints ───────────────────────────────────────────────────────────
  // Sign-in and sign-up are client-side Supabase calls — they go directly to
  // Supabase's auth servers, not through our API. Rate limiting here covers
  // our own auth-related API routes.

  // /api/profile/change-password — 5 attempts per 15 minutes per IP
  if (pathname === '/api/profile/change-password') {
    if (isRateLimited(`pwd_${ip}`, 5, 15 * 60 * 1000)) return rateLimitResponse(900)
  }

  // /api/profile/change-email — 3 attempts per hour per IP
  if (pathname === '/api/profile/change-email') {
    if (isRateLimited(`email_${ip}`, 3, 60 * 60 * 1000)) return rateLimitResponse(3600)
  }

  // /auth/callback — exchange auth code for session (OAuth + magic link)
  // 10 attempts per minute per IP (generous for legitimate redirects)
  if (pathname === '/auth/callback') {
    if (isRateLimited(`authcb_${ip}`, 10, 60 * 1000)) return rateLimitResponse(60)
  }

  // ── Generation / domain lookup endpoints ─────────────────────────────────────
  // 5 generate requests per minute per IP
  if (pathname.startsWith('/api/generate')) {
    if (isRateLimited(`gen_${ip}`, 5, 60 * 1000)) return rateLimitResponse(60)
  }

  // 20 RDAP/social checks per minute per IP
  if (pathname.startsWith('/api/check-domain') || pathname.startsWith('/api/social-check')) {
    if (isRateLimited(`rdap_${ip}`, 20, 60 * 1000)) return rateLimitResponse(60)
  }

  // 10 analysis requests per minute per IP (heavier — hits Groq + MarkerAPI)
  if (pathname.startsWith('/api/analyze')) {
    if (isRateLimited(`analyze_${ip}`, 10, 60 * 1000)) return rateLimitResponse(60)
  }

  // 20 score requests per minute per IP (hits Groq on every call)
  if (pathname.startsWith('/api/score')) {
    if (isRateLimited(`score_${ip}`, 20, 60 * 1000)) return rateLimitResponse(60)
  }

  // 5 billing requests per hour per IP (sensitive endpoint)
  if (pathname.startsWith('/api/billing')) {
    if (isRateLimited(`billing_${ip}`, 5, 60 * 60 * 1000)) return rateLimitResponse(3600)
  }

  // ── Supabase auth session refresh + dashboard protection ─────────────────────
  return updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
