-- DomainForge: Groq generation result cache
-- Caches AI-generated domain suggestions by prompt SHA-256 hash.
-- TTL strategy: rows expire after 1 hour (checked at query time).

create table if not exists public.generation_cache (
  cache_key   text primary key,                -- SHA-256 of normalized prompt JSON
  suggestions jsonb not null,                  -- array of DomainSuggestion objects
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null             -- created_at + 1 hour
);

-- Index for fast expiry checks
create index if not exists generation_cache_expires_idx
  on public.generation_cache (cache_key, expires_at);

-- Enable Row Level Security (CLAUDE.md: RLS on ALL tables)
alter table public.generation_cache enable row level security;

-- Public read — cached suggestions are not user-specific
create policy "Allow public read of generation cache"
  on public.generation_cache for select
  using (true);

-- Service role only for writes
create policy "Allow service role to write generation cache"
  on public.generation_cache for all
  using (auth.role() = 'service_role');
