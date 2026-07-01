-- DomainForge: Add socials and expiry to watchlist
-- We add columns to cache the results of social checks and WHOIS expiry dates.

alter table public.watchlist
  add column if not exists social_x text,
  add column if not exists social_ig text,
  add column if not exists social_x_available boolean,
  add column if not exists social_ig_available boolean,
  add column if not exists expires_at timestamptz;
