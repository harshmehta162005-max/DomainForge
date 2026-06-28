-- DomainForge: domain availability cache
-- Caches RDAP results to reduce latency and avoid rate limits.
-- TTL strategy: rows expire after 5 minutes (checked at query time).

create table if not exists public.domain_cache (
  id          uuid primary key default gen_random_uuid(),
  domain      text not null unique,         -- full domain e.g. "brewly.ai"
  available   boolean not null,
  status      text not null,                -- "available" | "taken" | "premium" | "unknown"
  checked_at  timestamptz not null default now(),
  expires_at  timestamptz not null,         -- checked_at + 5 min
  from_cache  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index for fast lookups by domain + expiry check
create index if not exists domain_cache_domain_idx
  on public.domain_cache (domain, expires_at);

-- Enable Row Level Security (CLAUDE.md: RLS on ALL tables)
alter table public.domain_cache enable row level security;

-- Public read — availability data is not sensitive
create policy "Allow public read of domain cache"
  on public.domain_cache for select
  using (true);

-- Service role only for writes (server-side only)
create policy "Allow service role to write domain cache"
  on public.domain_cache for all
  using (auth.role() = 'service_role');

-- Auto-cleanup: delete expired rows (run periodically via pg_cron or edge function)
-- For now, the application filters by expires_at > now() at query time.
