-- DomainForge: Add notification columns to shortlist
-- This allows the cron job to track and send alerts for shortlisted domains

alter table public.shortlist add column if not exists expires_at timestamptz;
alter table public.shortlist add column if not exists last_alerted_at timestamptz;
alter table public.shortlist add column if not exists alert_enabled boolean not null default true;
