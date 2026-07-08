-- DomainForge: Profile fields on user_settings
-- Adds display_name, avatar_url, bio, and unique username to user_settings.

alter table public.user_settings
  add column if not exists display_name text,
  add column if not exists avatar_url   text,
  add column if not exists bio          text check (char_length(bio) <= 160),
  add column if not exists username     text;

-- Unique index on username (case-insensitive, sparse — NULLs are allowed to repeat)
create unique index if not exists user_settings_username_unique
  on public.user_settings (lower(username))
  where username is not null;

-- Supabase Storage: create the 'avatars' bucket manually in the dashboard,
-- or run the following in the Supabase SQL editor (storage schema must exist):
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
