alter table public.user_settings add column if not exists notif_available boolean default true;
alter table public.user_settings add column if not exists notif_expiry boolean default true;
alter table public.user_settings add column if not exists notif_price boolean default false;
alter table public.user_settings add column if not exists default_tlds text default '.com,.io,.ai';
alter table public.user_settings add column if not exists auto_check boolean default false;
alter table public.user_settings add column if not exists check_interval text default '6h';
