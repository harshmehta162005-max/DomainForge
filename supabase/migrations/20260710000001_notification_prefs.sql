-- DomainForge: Notification preference columns
-- Adds master toggle, global frequency, and quiet hours to user_settings.

alter table public.user_settings
  add column if not exists notif_master        boolean default true,
  add column if not exists notif_frequency     text    default 'immediate'
                           check (notif_frequency in ('immediate', 'daily', 'weekly')),
  add column if not exists quiet_hours_enabled boolean default false,
  add column if not exists quiet_hours_start   text    default '22:00',
  add column if not exists quiet_hours_end     text    default '08:00',
  add column if not exists weekly_digest       boolean default true;
