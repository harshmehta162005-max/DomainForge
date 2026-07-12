// Sentry example API removed for production.
// If you need to test Sentry locally, temporarily add a throw here and revert before deploying.
import { NextResponse } from "next/server"
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
