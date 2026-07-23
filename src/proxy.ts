import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { redis } from '@/lib/redis'

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Uses Upstash Redis sliding-window when available (works across multiple
// serverless instances). Falls back to per-process in-memory map for local dev
// or when Redis is not configured.

interface RateLimitRecord {
  count: number
  windowStart: number
}

// In-memory fallback store
const rateLimits = new Map<string, RateLimitRecord>()

function isRateLimitedMemory(key: string, max: number, windowMs: number): boolean {
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

async function isRateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  if (redis) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000)
      const redisKey = `rl:${key}`
      // INCR + EXPIRE in a pipeline — atomic sliding window
      const pipeline = redis.pipeline()
      pipeline.incr(redisKey)
      pipeline.expire(redisKey, windowSeconds, 'NX') // Only set TTL on first hit
      const [count] = await pipeline.exec() as [number, number]
      return count > max
    } catch (e) {
      console.warn('[Redis] Rate limit check failed — falling back to in-memory:', e)
    }
  }
  // Fallback to in-memory
  return isRateLimitedMemory(key, max, windowMs)
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
    if (await isRateLimited(`pwd_${ip}`, 5, 15 * 60 * 1000)) return rateLimitResponse(900)
  }

  // /api/profile/change-email — 3 attempts per hour per IP
  if (pathname === '/api/profile/change-email') {
    if (await isRateLimited(`email_${ip}`, 3, 60 * 60 * 1000)) return rateLimitResponse(3600)
  }

  // /auth/callback — exchange auth code for session (OAuth + magic link)
  // 10 attempts per minute per IP (generous for legitimate redirects)
  if (pathname === '/auth/callback') {
    if (await isRateLimited(`authcb_${ip}`, 10, 60 * 1000)) return rateLimitResponse(60)
  }

  // ── Generation / domain lookup endpoints ─────────────────────────────────────
  // 5 generate requests per minute per IP
  if (pathname.startsWith('/api/generate')) {
    if (await isRateLimited(`gen_${ip}`, 5, 60 * 1000)) return rateLimitResponse(60)
  }

  // 20 RDAP/social checks per minute per IP
  if (pathname.startsWith('/api/check-domain') || pathname.startsWith('/api/social-check')) {
    if (await isRateLimited(`rdap_${ip}`, 20, 60 * 1000)) return rateLimitResponse(60)
  }

  // 10 analysis requests per minute per IP (heavier — hits Groq + MarkerAPI)
  if (pathname.startsWith('/api/analyze')) {
    if (await isRateLimited(`analyze_${ip}`, 10, 60 * 1000)) return rateLimitResponse(60)
  }

  // 20 score requests per minute per IP (hits Groq on every call)
  if (pathname.startsWith('/api/score')) {
    if (await isRateLimited(`score_${ip}`, 20, 60 * 1000)) return rateLimitResponse(60)
  }

  // 5 billing requests per hour per IP (sensitive endpoint)
  if (pathname.startsWith('/api/billing')) {
    if (await isRateLimited(`billing_${ip}`, 5, 60 * 60 * 1000)) return rateLimitResponse(3600)
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
