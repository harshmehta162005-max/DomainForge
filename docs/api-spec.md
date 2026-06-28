# API Specification — DomainForge

## Base URL
All routes under `/api/`

## Authentication
- **Public routes**: No auth required
- **Protected routes**: Supabase JWT (Bearer token) or SSR session cookie

---

## 1. Generation Routes

### POST /api/generate
**Description**: Generate domain name suggestions using Groq LLM.  
**Auth**: Public (rate-limited: 10 req/min per IP)

**Request Body** (Zod schema):
```ts
{
  businessDescription: string,        // "A coffee subscription for remote workers"
  categories: string[],               // ["SaaS", "AI", "E-commerce"]
  targetAudience: string,             // "millennials, remote workers"
  problemSolved: string,              // "remembering to reorder coffee"
  preferences: {
    modern: number,                   // 0-100
    cool: number,                     // 0-100
    professional: number,             // 0-100
    short: number,                    // 0-100 (higher = prefer shorter names)
    memorable: number,                // 0-100
    brandable: number,                // 0-100
    length: 'short' | 'medium' | 'long'
  },
  tlds: string[],                     // optional, e.g. [".com", ".io", ".ai"]
  count: number                       // default 30, max 50
}
```

**Response**:
```ts
{
  suggestions: [
    {
      domain: "brewly.ai",
      baseName: "brewly",
      tld: ".ai",
      available: boolean,
      availabilityStatus: "available" | "taken" | "premium" | "unknown",
      score: 92,                      // 0-100
      explanation: "Strong brandable name...",
      style: "brandable" | "compound" | "invented" | "keyword" | "alliteration",
      priceEstimate: "12.99",         // USD/yr, nullable
      registrarLinks: {
        namecheap: "https://...",
        godaddy: "https://..."
      }
    }
  ],
  metadata: {
    totalGenerated: 45,
    cached: 12,
    sessionId: "uuid"
  }
}
```

**Errors**:
```ts
{ error: "Validation failed", code: "INVALID_INPUT", details: ZodError }
{ error: "LLM unavailable", code: "LLM_ERROR" }
{ error: "Rate limit exceeded", code: "RATE_LIMIT", retryAfter: 60 }
```

---

## 2. Availability Routes

### POST /api/check-domain
**Description**: Batch availability check for a list of domains.  
**Auth**: Public (rate-limited)

**Request**:
```ts
{ domains: string[] }  // max 20 per request, e.g. ["brewly.ai", "brewly.com"]
```

**Response**:
```ts
{
  results: {
    "brewly.ai": {
      available: boolean,
      status: "available" | "taken" | "premium" | "unknown",
      checkedAt: string,     // ISO timestamp
      fromCache: boolean
    }
  }
}
```

---

## 3. User Routes (Protected — Supabase Auth required)

### GET /api/user/shortlist
Returns the authenticated user's shortlisted domains.

**Response**: `{ shortlist: ShortlistItem[] }`

### POST /api/user/shortlist
Add a domain to shortlist.

**Request**: `{ domain: string, score?: number, notes?: string }`  
**Response**: `{ id: string, domain: string }`

### DELETE /api/user/shortlist/:id
Remove a domain from shortlist.

### GET /api/user/watchlist
Returns the authenticated user's watchlist.

### POST /api/user/watchlist
Add a domain to watchlist for monitoring.

**Request**: `{ domain: string, notify: boolean }`  
**Response**: `{ id: string }`

### POST /api/watchlist/check
Trigger a manual availability re-check on watchlist items.  
**Auth**: Protected, internal cron use.

---

## 4. Internal / Admin

- `POST /api/internal/prompt-test` — Test prompt variants (env: dev only)
- `GET /api/internal/analytics` — Usage stats (env: dev only)

---

## Standard Error Format
```ts
{
  error: string,      // Human-readable message
  code: string,       // Machine-readable code (SCREAMING_SNAKE_CASE)
  details?: unknown   // Optional: Zod errors, stack trace (dev only)
}
```

## Rate Limits
| Route | Anonymous | Authenticated |
|---|---|---|
| POST /api/generate | 10 req/min | 30 req/min |
| POST /api/check-domain | 20 req/min | 60 req/min |
| User routes | — | 60 req/min |
