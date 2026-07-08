/**
 * MarkerAPI — Real USPTO Trademark Search
 * https://markerapi.com
 * Free tier: 1,000 searches/month
 * Register at https://markerapi.com to get credentials.
 */

export interface UsptoTrademark {
  serialnumber: string
  wordmark: string
  status: string            // e.g. "LIVE/REGISTERED", "DEAD/CANCELLED"
  statusCode: string
  description: string       // goods & services description
  code: string              // IC (Nice Class) code, e.g. "009, 042"
  registrationdate: string  // e.g. "2019-03-05"
  owner: string             // registered owner / company
}

export interface MarkerApiResult {
  count: number
  trademarks: UsptoTrademark[]
  error?: string
}

/**
 * Search the USPTO trademark database via MarkerAPI v2.
 * Returns active (live/registered) trademarks matching the search term.
 * Falls back to { count: 0, trademarks: [] } on any failure — never throws.
 *
 * @param term      The base word to search (e.g. "stripe", "brewly")
 * @param username  MarkerAPI username from env
 * @param password  MarkerAPI password from env
 * @param maxResults Cap results returned (default 10 — first page = up to 100)
 */
export async function searchUSPTOTrademarks(
  term: string,
  username: string,
  password: string,
  maxResults = 10,
): Promise<MarkerApiResult> {
  const empty: MarkerApiResult = { count: 0, trademarks: [] }

  if (!term || !username || !password) return empty

  try {
    const encodedTerm = encodeURIComponent(term.toLowerCase().trim())
    const url = `https://markerapi.com/api/v2/trademarks/trademark/${encodedTerm}/status/active/start/1/username/${encodeURIComponent(username)}/password/${encodeURIComponent(password)}`

    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "DomainForge/1.0" },
      signal: AbortSignal.timeout(8000), // 8s timeout — don't block the whole analyze route
    })

    if (!res.ok) {
      console.warn(`[MarkerAPI] HTTP ${res.status} for "${term}"`)
      return { ...empty, error: `HTTP ${res.status}` }
    }

    const data = await res.json() as {
      count?: number
      trademarks?: Array<{
        serialnumber?: string
        wordmark?: string
        status?: string
        statuscode?: string
        description?: string
        code?: string
        registrationdate?: string
        owner?: string
      }>
      error?: string
    }

    if (data.error) {
      console.warn(`[MarkerAPI] API error for "${term}":`, data.error)
      return { ...empty, error: data.error }
    }

    const trademarks: UsptoTrademark[] = (data.trademarks ?? [])
      .slice(0, maxResults)
      .map(tm => ({
        serialnumber:     tm.serialnumber     ?? "N/A",
        wordmark:         tm.wordmark         ?? term,
        status:           tm.status           ?? "UNKNOWN",
        statusCode:       tm.statuscode       ?? "",
        description:      tm.description      ?? "No description",
        code:             tm.code             ?? "",
        registrationdate: tm.registrationdate ?? "",
        owner:            tm.owner            ?? "Unknown",
      }))

    return {
      count: data.count ?? trademarks.length,
      trademarks,
    }
  } catch (err: any) {
    console.warn(`[MarkerAPI] Fetch failed for "${term}":`, err?.message ?? err)
    return { ...empty, error: err?.message ?? "Network error" }
  }
}

/**
 * Compute a simple conflict score from USPTO results.
 * Used to augment (not replace) the Groq AI risk score.
 *
 * - 0 exact active matches  → adds 0  pts
 * - 1 exact active match    → adds 25 pts
 * - 2+ exact active matches → adds 40 pts
 * - Any partial match       → adds 10 pts
 */
export function computeUsptoConflictBonus(
  term: string,
  trademarks: UsptoTrademark[],
): number {
  const normalizedTerm = term.toLowerCase().trim()
  const exactMatches = trademarks.filter(
    tm => tm.wordmark.toLowerCase().trim() === normalizedTerm
  )
  const hasPartial = trademarks.length > 0 && exactMatches.length === 0

  if (exactMatches.length >= 2) return 40
  if (exactMatches.length === 1) return 25
  if (hasPartial) return 10
  return 0
}
