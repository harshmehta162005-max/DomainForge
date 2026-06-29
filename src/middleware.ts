import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─── In-memory rate limiter (per-process, good enough for MVP) ────────────────
// In production, replace with Redis/Upstash for cross-instance consistency.

const rateLimits = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS = 60 * 1000 // 1 minute

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now()
  const record = rateLimits.get(key)
  if (!record || now - record.windowStart > WINDOW_MS) {
    rateLimits.set(key, { count: 1, windowStart: now })
    return false
  }
  if (record.count >= max) return true
  record.count += 1
  return false
}

function rateLimitResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.', code: 'RATE_LIMITED' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
  )
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const pathname = request.nextUrl.pathname

  // ── Rate limiting ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/generate')) {
    if (isRateLimited(`gen_${ip}`, 5)) return rateLimitResponse()
  }

  if (pathname.startsWith('/api/check-domain') || pathname.startsWith('/api/social-check')) {
    if (isRateLimited(`rdap_${ip}`, 20)) return rateLimitResponse()
  }

  // ── Supabase auth session refresh + dashboard protection ─────────────────────
  // Must run on every request that touches auth-protected routes.
  // updateSession() refreshes the access token cookie and redirects
  // unauthenticated users away from /dashboard/*.
  return updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
