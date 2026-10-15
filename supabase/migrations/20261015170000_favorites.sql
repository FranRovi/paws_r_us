create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

alter table public.favorites enable row level security;

create policy "Users read their own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Users add their own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users remove their own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);