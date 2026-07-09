-- DomainForge: Add timezone to user_settings for Quiet Hours enforcement
alter table public.user_settings
  add column if not exists timezone text default 'UTC';
