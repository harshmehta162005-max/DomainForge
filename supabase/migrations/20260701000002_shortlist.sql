-- DomainForge: user shortlist
-- Stores domains a user wants to shortlist / favorite.

create table if not exists public.shortlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  domain      text not null,
  status      text not null default 'unknown',
  notes       text,
  created_at  timestamptz not null default now()
);

-- Unique: one user cannot save the same domain twice
create unique index if not exists shortlist_user_domain_idx
  on public.shortlist (user_id, domain);

-- Fast lookup by user
create index if not exists shortlist_user_id_idx
  on public.shortlist (user_id);

-- RLS: users can only access their own rows
alter table public.shortlist enable row level security;

create policy "Users can read their own shortlist"
  on public.shortlist for select
  using (auth.uid() = user_id);

create policy "Users can insert to their own shortlist"
  on public.shortlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own shortlist"
  on public.shortlist for delete
  using (auth.uid() = user_id);

create policy "Users can update their own shortlist"
  on public.shortlist for update
  using (auth.uid() = user_id);
