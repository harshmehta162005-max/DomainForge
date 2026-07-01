alter table public.watchlist
  add column if not exists score integer not null default 0,
  add column if not exists tags text[] not null default '{}',
  add column if not exists price_estimate text,
  add column if not exists alert_enabled boolean not null default true;
