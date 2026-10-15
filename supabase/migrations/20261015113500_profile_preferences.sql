-- Extra profile fields from the Edit profile design
alter table public.profiles
  add column if not exists home_type text not null default 'House with a yard',
  add column if not exists tenure text not null default 'I own my home',
  add column if not exists other_pets text not null default 'No other pets',
  add column if not exists notify_appointments boolean not null default true,
  add column if not exists notify_applications boolean not null default true,
  add column if not exists notify_messages boolean not null default false;

-- Each user can read and update only their own row
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);