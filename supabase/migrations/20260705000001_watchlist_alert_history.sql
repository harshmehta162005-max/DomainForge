alter table public.watchlist
  add column if not exists last_alerted_at timestamptz;
