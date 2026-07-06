-- Add UPDATE policy for activity_history so users can mark notifications as read
create policy "Users can update their own activity history."
    on public.activity_history for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
