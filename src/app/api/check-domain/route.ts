import { NextResponse } from "next/server"
import { z } from "zod"
import { checkDomainsAvailability } from "@/lib/domain/availability"

const CheckDomainSchema = z.object({
  domains: z
    .array(z.string().min(3))
    .min(1)
    .max(20, "Max 20 domains per request"),
  forceRefresh: z.boolean().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const parsed = CheckDomainSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "INVALID_INPUT",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  try {
    const results = await checkDomainsAvailability(
      parsed.data.domains, 
      5,
      parsed.data.domains.map(d => ({ domain: d, isPrimary: true, forceRefresh: parsed.data.forceRefresh }))
    )
    const output: Record<string, { available: boolean; status: string; checkedAt: string; fromCache: boolean; expiresAt?: string }> = {}

    for (const [domain, result] of results.entries()) {
      output[domain] = {
        available: result.available,
        status: result.status,
        checkedAt: result.checkedAt,
        fromCache: result.fromCache,
        expiresAt: result.expiresAt,
      }
    }

    return NextResponse.json({ results: output })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Availability check failed: ${message}`, code: "RDAP_ERROR" },
      { status: 502 },
    )
  }
}
