create index if not exists idx_watchlist_alerts on public.watchlist(user_id, alert_enabled, last_alerted_at);
