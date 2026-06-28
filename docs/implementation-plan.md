# Implementation Plan — DomainForge

## Phase 0: Project Setup (1–2 days)
- [ ] Initialize Next.js 15 app with TypeScript, Tailwind, ESLint
- [ ] Set up Supabase project (DB + Auth)
- [ ] Configure environment variables (`.env.local`)
- [ ] Install core dependencies (shadcn, zod, tanstack-query, groq-sdk, etc.)
- [ ] Set up Git + conventional commits
- [ ] Create folder structure per `CLAUDE.md`

## Phase 1: Core Generator (MVP — 7–10 days)

### Week 1
- [ ] Landing page + marketing copy
- [ ] Domain Generator Form UI (sliders, inputs, categories)
- [ ] LLM integration + prompt library (`lib/groq/`)
- [ ] Basic name generation endpoint (`POST /api/generate`)
- [ ] Domain availability service layer (mock first, real API in Week 2)

### Week 2
- [ ] Results page with table + filters
- [ ] Real domain API integration + caching (Upstash / Supabase)
- [ ] Scoring system
- [ ] Responsive design & polish
- [ ] Error handling & loading states (skeleton loaders)

## Phase 2: User Features (10–14 days)
- [ ] Auth (Supabase email/password + Google OAuth)
- [ ] User profiles & search history
- [ ] Shortlist & favorites
- [ ] Watchlist + basic email alerts (Resend)
- [ ] Export functionality (CSV via json2csv)

## Phase 3: Polish & Advanced (7–10 days)
- [ ] Dashboard & analytics
- [ ] Bulk upload (CSV of keywords)
- [ ] Logo generation integration (optional)
- [ ] SEO optimization (metadata, OG, sitemap)
- [ ] Performance tuning (Core Web Vitals)

## Phase 4: Launch & Iteration
- [ ] Deploy to Vercel (production)
- [ ] Add Sentry + Vercel Analytics
- [ ] README + setup docs polish
- [ ] Blog post / Product Hunt launch

## Dependencies & Risks

**Critical Dependencies**:
- Domain API key (DomScan / Whoisfreaks — budget $10–20/month initially)
- Groq API credits
- Supabase free tier limits (500MB DB, 50K MAU)
- Upstash Redis free tier (10K commands/day)

**Risks & Mitigations**:
| Risk | Mitigation |
|---|---|
| LLM cost overruns | Token limiting + aggressive prompt caching (1hr TTL by prompt hash) |
| API rate limits | Redis caching layer as first-line defence |
| Suggestion quality | Human review loop + prompt iteration (docs/prompts.md) |
| Legal (domain scraping) | Stick to official APIs only (RDAP, DomScan, Whoisfreaks) |

**Timeline**: 4–6 weeks for full MVP at high quality.
**Daily**: 2–4 hours focused coding + documentation.
