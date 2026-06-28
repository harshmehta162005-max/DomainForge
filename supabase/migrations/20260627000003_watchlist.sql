-- DomainForge: user watchlist
-- Stores domains a user wants to monitor for availability.
-- One user → many entries. One entry → one domain per user (unique).

create table if not exists public.watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  domain      text not null,            -- e.g. "brewly.ai"
  status      text not null default 'unknown',   -- AvailabilityStatus enum
  notes       text,                     -- optional user notes
  created_at  timestamptz not null default now()
);

-- Unique: one user cannot save the same domain twice
create unique index if not exists watchlist_user_domain_idx
  on public.watchlist (user_id, domain);

-- Fast lookup by user
create index if not exists watchlist_user_id_idx
  on public.watchlist (user_id);

-- RLS: users can only access their own rows
alter table public.watchlist enable row level security;

create policy "Users can read their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert to their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

create policy "Users can update their own watchlist"
  on public.watchlist for update
  using (auth.uid() = user_id);
