import { NextResponse } from "next/server"
import { redis, REDIS_AVAILABLE } from "@/lib/redis"
import { getCachedAvailability, setCachedAvailability } from "@/lib/domain/cache"

/**
 * GET /api/debug/redis
 * Verifies Redis connectivity, read/write, and the cache fallback chain.
 * Remove or protect this endpoint before going to production.
 */
export async function GET() {
  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    redis_configured: REDIS_AVAILABLE,
  }

  // ── 1. Ping Redis ──────────────────────────────────────────────────────────
  if (redis) {
    try {
      const pong = await redis.ping()
      report.redis_ping = pong // should be "PONG"
    } catch (e) {
      report.redis_ping_error = String(e)
    }
  } else {
    report.redis_ping = "skipped — Redis not configured"
  }

  // ── 2. Test cache write (domain availability) ─────────────────────────────
  const testDomain = "redis-test-verify-domainforge.com"
  const fakeResult = {
    available: true,
    status: "available" as const,
    rdapTier: "tier1" as const,
    isParked: false,
    checkedAt: new Date().toISOString(),
    fromCache: false,
  }

  try {
    await setCachedAvailability(testDomain, fakeResult)
    report.cache_write = "✅ success"
  } catch (e) {
    report.cache_write = `❌ failed: ${String(e)}`
  }

  // ── 3. Test cache read (should hit Redis first) ───────────────────────────
  try {
    const cached = await getCachedAvailability(testDomain)
    if (cached) {
      report.cache_read = "✅ success"
      report.cache_read_source = cached.fromCache ? "cache" : "fresh"
    } else {
      report.cache_read = "⚠️ miss — nothing returned (check Supabase connection)"
    }
  } catch (e) {
    report.cache_read = `❌ failed: ${String(e)}`
  }

  // ── 4. Test Redis raw write/read ──────────────────────────────────────────
  if (redis) {
    try {
      await redis.set("debug:ping-test", "hello", { ex: 60 })
      const val = await redis.get("debug:ping-test")
      report.redis_raw_rw = val === "hello" ? "✅ write & read confirmed" : `⚠️ unexpected value: ${val}`
    } catch (e) {
      report.redis_raw_rw = `❌ failed: ${String(e)}`
    }
  } else {
    report.redis_raw_rw = "skipped — Redis not configured, using Supabase fallback"
  }

  return NextResponse.json(report, { status: 200 })
}
