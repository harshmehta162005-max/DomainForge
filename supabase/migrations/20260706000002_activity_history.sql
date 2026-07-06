-- DomainForge: Isolated Activity History
-- We create an independent history table so that even if a domain is removed from the watchlist, the history remains.

create table if not exists public.activity_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    domain text not null,
    event_type text not null, -- 'saved', 'removed', 'generated', 'checked', 'status_changed', 'price_changed'
    note text,
    created_at timestamptz default now() not null
);

-- RLS
alter table public.activity_history enable row level security;

create policy "Users can view their own activity history."
    on public.activity_history for select
    using (auth.uid() = user_id);

create policy "Users can insert their own activity history."
    on public.activity_history for insert
    with check (auth.uid() = user_id);

-- Optional: users can clear their history if they want
create policy "Users can delete their own activity history."
    on public.activity_history for delete
    using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists activity_history_user_id_idx on public.activity_history(user_id);
create index if not exists activity_history_created_at_idx on public.activity_history(created_at desc);
