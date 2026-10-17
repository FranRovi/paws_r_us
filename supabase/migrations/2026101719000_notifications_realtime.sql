-- Lets the app hear about new notifications as they are created.
alter publication supabase_realtime add table public.notifications;