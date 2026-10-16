create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_pet_id_idx on public.applications (pet_id);

-- One ACTIVE application per user and pet (cancelled or rejected ones don't count).
create unique index applications_one_active_per_user_pet
  on public.applications (user_id, pet_id)
  where status in ('pending', 'in_review', 'accepted');

-- Rules that run on every insert and update, whoever sends them.
create or replace function public.enforce_application_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  active_statuses constant text[] := array['pending', 'in_review', 'accepted'];
  active_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.pet_id <> old.pet_id then
      raise exception 'application_immutable';
    end if;
    new.updated_at := now();
  end if;

  -- Check the limit whenever an application becomes active
  -- (a new one, or an old one being switched back to active).
  if new.status = any (active_statuses)
     and (tg_op = 'INSERT' or not (old.status = any (active_statuses))) then
    -- Make two simultaneous requests from the same user wait for each other.
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));

    select count(*) into active_count
    from public.applications
    where user_id = new.user_id
      and status = any (active_statuses)
      and id <> new.id;

    if active_count >= 3 then
      raise exception 'application_limit_reached';
    end if;
  end if;

  return new;
end;
$$;

create trigger applications_rules
  before insert or update on public.applications
  for each row execute function public.enforce_application_rules();

-- Row Level Security: users only see and touch their own applications.
alter table public.applications enable row level security;

create policy "Users read their own applications"
  on public.applications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users create their own pending applications"
  on public.applications for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

create policy "Users can cancel their own active applications"
  on public.applications for update to authenticated
  using (auth.uid() = user_id and status in ('pending', 'in_review', 'accepted'))
  with check (auth.uid() = user_id and status = 'cancelled');

-- The waiting list for one pet, without any user information.
-- Needed because users cannot read other users' applications.
create or replace function public.pet_waiting_list(p_pet_id uuid)
returns table (id uuid, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.status, a.created_at
  from public.applications a
  where a.pet_id = p_pet_id
    and a.status in ('pending', 'in_review', 'accepted')
  order by a.created_at, a.id
$$;

revoke execute on function public.pet_waiting_list(uuid) from public, anon;
grant execute on function public.pet_waiting_list(uuid) to authenticated;