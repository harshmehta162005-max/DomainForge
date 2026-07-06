alter table public.watchlist
  add column if not exists notify_frequency text check (notify_frequency in ('immediate', 'daily', 'weekly')) default 'immediate',
  add column if not exists notification_preferences jsonb default '{"availability": true, "price_drop": true, "expiration": true}'::jsonb;
