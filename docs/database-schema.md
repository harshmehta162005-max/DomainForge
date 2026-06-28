# Database Schema — DomainForge (Supabase PostgreSQL)

## Tables

### 1. profiles (extends Supabase Auth)
```sql
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### 2. searches (generation history)
```sql
create table public.searches (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  query       jsonb not null,     -- full GenerationRequest object
  result_count int,
  created_at  timestamptz default now() not null
);

-- Indexes
create index searches_user_id_created_at on public.searches (user_id, created_at desc);

-- RLS
alter table public.searches enable row level security;
create policy "Users see own searches"
  on public.searches for all using (auth.uid() = user_id);
```

---

### 3. shortlists
```sql
create table public.shortlists (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  domain      text not null,
  score       integer check (score >= 0 and score <= 100),
  notes       text,
  added_at    timestamptz default now() not null,
  unique (user_id, domain)    -- one entry per user per domain
);

-- Indexes
create index shortlists_user_id on public.shortlists (user_id);

-- RLS
alter table public.shortlists enable row level security;
create policy "Users manage own shortlist"
  on public.shortlists for all using (auth.uid() = user_id);
```

---

### 4. watchlists
```sql
create table public.watchlists (
  id            bigserial primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  domain        text not null,
  status        text default 'unknown',   -- "available" | "taken" | "premium" | "unknown"
  last_checked  timestamptz,
  notify        boolean default true,
  created_at    timestamptz default now() not null,
  unique (user_id, domain)
);

-- Indexes
create index watchlists_user_id_domain on public.watchlists (user_id, domain);
create index watchlists_last_checked on public.watchlists (last_checked);

-- RLS
alter table public.watchlists enable row level security;
create policy "Users manage own watchlist"
  on public.watchlists for all using (auth.uid() = user_id);
```

---

### 5. availability_cache
```sql
create table public.availability_cache (
  domain      text primary key,
  available   boolean,
  status      text,   -- "available" | "taken" | "premium" | "unknown"
  checked_at  timestamptz default now() not null,
  expires_at  timestamptz,   -- checked_at + cache TTL (5min–24hr depending on status)
  data        jsonb          -- raw API response for debugging
);

-- Indexes
create index availability_cache_expires_at on public.availability_cache (expires_at);

-- No RLS needed — public read for cache lookups
-- Only service role can write
```

---

## RLS Summary

| Table | Policy |
|---|---|
| `profiles` | Owner only (select + update) |
| `searches` | Owner only (all) |
| `shortlists` | Owner only (all) |
| `watchlists` | Owner only (all) |
| `availability_cache` | Public read, service role write |

## Index Summary

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `searches_user_id_created_at` | searches | user_id, created_at DESC | History feed |
| `shortlists_user_id` | shortlists | user_id | Shortlist lookups |
| `watchlists_user_id_domain` | watchlists | user_id, domain | Watchlist management |
| `watchlists_last_checked` | watchlists | last_checked | Cron: find stale entries |
| `availability_cache_expires_at` | availability_cache | expires_at | Cache expiry cleanup |

## Notes & Schema Decisions

- `shortlists.domain` is unique **per user** (`unique(user_id, domain)`) — not globally unique
- `availability_cache` TTL strategy: available domains cache 5min (fast changing), taken domains cache 24hr
- `searches` stores the full `query` jsonb so results can be regenerated without re-prompting
- All timestamps are `timestamptz` (timezone-aware), not bare `timestamp`
- `profiles.id` cascades delete to all user tables — deleting auth user cleans up everything
