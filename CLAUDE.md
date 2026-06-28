# DomainForge — Claude Operating Rules
# Single source of truth. Keep under 200 lines. Prune before adding.

## PROJECT
Next.js 15 (App Router) · TypeScript strict · Tailwind · shadcn/ui · Supabase · Groq LLM · RDAP / DomScan / Whoisfreaks (availability) · Vercel

## KARPATHY BEHAVIORAL RULES (Non-Negotiable)
1. **Think before coding** — Articulate approach before writing a single line.
2. **Simplicity first** — Simplest solution that works. No premature abstraction.
3. **Surgical changes only** — Touch ONLY explicitly requested files. Run /diff after every edit.
4. **Verify before done** — Re-read the original request. Confirm every requirement is met.

## GRILL-ME RULE
Before ANY new feature: run grill-me. Ask ONE clarifying question at a time. Wait for answer. No planning until interview is complete.

## TECH STACK CONVENTIONS
- TypeScript `strict: true` — no `any`, no type assertions without comment
- Zod for ALL external input validation (API routes, form data, env vars)
- Server Components by default; `"use client"` only when required (interactivity/hooks)
- Supabase SSR client in Server Components; browser client in Client Components
- Route handlers in `app/api/*/route.ts` — always validate with Zod before processing
- `lib/utils.ts` for `cn()` — never inline clsx/tailwind-merge calls
- Environment vars: validated at startup via `lib/env.ts` (Zod schema)
- Error handling: `Result<T, E>` pattern — no bare try/catch returning undefined
- User-facing errors: always show a human-readable message, never raw exception text

## FOLDER CONVENTIONS
```
domainforge/
├── .claude/                    # Vibe coding config (settings, hooks, skills, agents, commands)
├── docs/                       # Project docs (never auto-generated)
│   ├── PRD.md
│   ├── implementation-plan.md
│   ├── api-spec.md
│   └── database-schema.md
├── supabase/
│   └── migrations/             # SQL migration files — never edit manually
├── public/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (fonts, providers, metadata)
│   │   ├── globals.css
│   │   ├── (public)/           # No auth required
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Landing page + hero GenerationForm
│   │   │   └── generate/
│   │   │       └── page.tsx    # Results page (domain suggestions)
│   │   ├── (app)/              # Auth-guarded routes
│   │   │   ├── layout.tsx      # Auth check + redirect
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── shortlist/
│   │   │       │   └── page.tsx
│   │   │       └── watchlist/
│   │   │           └── page.tsx
│   │   └── api/                # Route handlers — Zod validate before processing
│   │       ├── generate/route.ts
│   │       ├── check-domain/route.ts
│   │       ├── shortlist/route.ts
│   │       └── watchlist/route.ts
│   ├── components/
│   │   ├── ui/                 # shadcn primitives — NEVER modify directly
│   │   ├── domain/             # DomainCard, AvailabilityBadge, ResultsGrid
│   │   ├── generate/           # GenerationForm, SliderControl, ToneSelector
│   │   ├── dashboard/          # WatchlistTable, ShortlistView
│   │   └── layout/             # Header, Footer, Nav
│   ├── lib/
│   │   ├── supabase/           # client.ts (browser), server.ts (SSR), middleware.ts
│   │   ├── groq/               # client.ts, prompt-builder.ts, parser.ts
│   │   ├── domain/             # availability.ts, domain-api.ts (DomScan), cache.ts
│   │   └── utils.ts            # cn() and shared pure helpers
│   ├── hooks/                  # use-generate.ts, use-availability.ts, use-watchlist.ts
│   └── types/                  # domain.ts, supabase.ts, api.ts (Zod schemas + TS types)
├── CLAUDE.md
├── design.md
├── CONTEXT.md
├── HANDOFF.md
├── .claudeignore
├── .env.local                  # Git-ignored
├── components.json             # shadcn config
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```


## FORBIDDEN PATTERNS
- No `any` type (use `unknown` + narrowing)
- No purple/violet gradients
- No cards-inside-cards
- No bounce/elastic/spring animations
- No Inter as primary font
- No `--dangerously-skip-permissions`
- No modifying shadcn `/components/ui/*` directly
- No secrets in client-side code
- No bare `fetch()` without error handling
- No horizontal phasing — always vertical slices

## QUALITY GATES (Spartan — sequential, no skipping)
```
typecheck → lint → test → review
```
If typecheck fails: STOP. Fix. Do not run lint.
If lint fails: STOP. Fix. Do not run tests.
Never patch a test to make it pass. Fix the code.

## COMMANDS
```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest
npm run format       # Prettier
```

## DESIGN RULE
Read `design.md` before ANY frontend work. Inject it at the top of every design session. Silence = Claude defaults.

## AVAILABLE SLASH COMMANDS
/grill · /simplify · /review · /handoff · /techdebt · /pr · /context-dump · /caveman

## EXTERNAL DOCS
@docs/git-instructions.md — Git workflow and branch conventions
@CONTEXT.md — Domain terminology and glossary

## AI GENERATION RULES (Groq)
- Always use structured output with Zod schema validation
- Prompt template lives in `lib/groq/prompt-builder.ts` — never inline prompts in routes
- Parse LLM output through `lib/groq/parser.ts` before returning to client
- Rate limit: 10 requests/min per user (enforce in middleware)

## CACHING RULES
- RDAP domain checks: cache 5 min in Supabase (table: `domain_cache`)
- Groq generation results: cache 1 hour by prompt hash
- Use `next/cache` `unstable_cache` for Server Component caching

## SUPABASE RULES
- RLS enabled on ALL tables
- Never expose service role key client-side
- Auth: SSR cookies via `@supabase/ssr`
- Migrations in `supabase/migrations/` — never edit manually

## COMMUNICATION STYLE
- Show plan before coding — never silently start writing.
- After every edit, summarize: what changed, what file, and why.
- Be concise but clear. One decision per message when asking questions.
- If requirements are ambiguous: ask. Never make silent assumptions.

## PROJECT PRIORITIES
1. Excellent UX — fast, beautiful results page above all else
2. Reliable domain availability — cache aggressively, fail gracefully
3. User accounts + watchlist — Supabase Auth, RLS on all tables
4. Non-generic, professional design — follow design.md without compromise

## SESSION RULES
- Create HANDOFF.md before ending any session > 30 min
- Run /context-dump at session midpoint
- Prune CLAUDE.md if rules were added (keep under 200 lines)
