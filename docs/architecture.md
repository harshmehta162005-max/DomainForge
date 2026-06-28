# System Architecture — DomainForge

## High-Level Overview

DomainForge follows a modern full-stack architecture with Next.js App Router as the core.

```
Client (Browser)
        │
Next.js 15 (App Router + Server Components)
        ├── API Routes / Server Actions
        └── React UI + Tailwind
        │
Supabase (PostgreSQL + Auth + Storage)
        │
Background Workers (Redis + BullMQ or Vercel Cron)
        │
External Services:
        ├── LLM API (Groq / Claude)
        ├── Domain Availability API (DomScan / Whoisfreaks / RDAP)
        └── Redis Cache (Upstash)
```

## Key Components

### 1. Frontend
- Next.js 15 App Router
- TypeScript (strict)
- Tailwind + shadcn/ui + Radix
- React Hook Form + Zod validation
- TanStack Query for data fetching
- Recharts or Tremor for dashboards

### 2. Backend
- Next.js Route Handlers (API routes)
- Server Actions for mutations
- Zod for schema validation
- Rate limiting (Upstash Ratelimit or custom)

### 3. Data Layer
- Supabase PostgreSQL
- Row Level Security (RLS) on all tables
- Supabase JS client (`@supabase/ssr` for SSR)

### 4. AI Layer
- Structured prompting with JSON mode (Groq)
- Multi-step generation pipeline:
  1. Idea expansion
  2. Name generation (18-50 base names)
  3. Scoring & explanation
- Prompt versioning in `lib/groq/prompt-builder.ts`

### 5. Caching & Performance
- Upstash Redis for domain availability cache (TTL 1h–24h)
- Supabase `availability_cache` table as fallback
- Next.js ISR / Revalidation for static pages
- Edge caching where possible

### 6. Background Jobs
- Watchlist monitoring (Vercel Cron)
- Email alerts via Resend
- Periodic cache refresh

## Data Flow — Generate Names

```
1. User submits GenerationForm → Server Action / POST /api/generate
2. Validate input (Zod schema)
3. Check Groq result cache (prompt hash) → return if HIT
4. Call Groq LLM → structured JSON response
5. For each base name: check availability cache → RDAP/DomScan if MISS
6. Score & enrich results
7. Return to client + save to searches table (if logged in)
```

## Security Considerations
- Input sanitization + Zod validation on every route
- Rate limiting per IP (anonymous) / per user (authenticated)
- API keys in env vars only — never client-side
- Supabase RLS policies on all user-owned tables
- No sensitive data in logs or error responses

## Scalability Notes
- Start serverless (Vercel)
- Easy to extract to dedicated backend if needed
- Horizontal scaling via Supabase + Upstash Redis

## Monitoring & Observability
- Vercel Analytics (traffic)
- Sentry (error tracking + LLM errors)
- Custom logs for LLM costs & accuracy tracking
- PostHog (optional, user behavior)
