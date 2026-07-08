-- ─── Step 1: Create domain_cache if it doesn't exist yet ───────────────────
create table if not exists public.domain_cache (
  id          uuid primary key default gen_random_uuid(),
  domain      text not null unique,
  available   boolean not null,
  status      text not null,
  checked_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  from_cache  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists domain_cache_domain_idx
  on public.domain_cache (domain, expires_at);

alter table public.domain_cache enable row level security;

do $$ begin
  create policy "Allow public read of domain cache"
    on public.domain_cache for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow service role to write domain cache"
    on public.domain_cache for all using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

-- ─── Step 2: Create generation_cache if it doesn't exist yet ───────────────
create table if not exists public.generation_cache (
  cache_key   text primary key,
  suggestions jsonb not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists generation_cache_expires_idx
  on public.generation_cache (cache_key, expires_at);

alter table public.generation_cache enable row level security;

do $$ begin
  create policy "Allow public read of generation cache"
    on public.generation_cache for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow service role to write generation cache"
    on public.generation_cache for all using (auth.role() = 'service_role');
exception when duplicate_object then null;
end $$;

-- ─── Step 3: Add new columns (safe — no-op if already exist) ───────────────
alter table public.domain_cache add column if not exists rdap_tier text default 'tier1';
alter table public.domain_cache add column if not exists is_parked boolean default false;

-- ─── Step 4: Create cleanup function ───────────────────────────────────────
create or replace function public.cleanup_expired_cache()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.domain_cache where expires_at < now();
  delete from public.generation_cache where expires_at < now();
end;
$$;
