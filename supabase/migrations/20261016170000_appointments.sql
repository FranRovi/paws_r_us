-- Appointments: a meet and greet, then a home visit, for each application.

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shelter_id uuid not null references public.shelters(id),
  kind text not null check (kind in ('meet', 'home')),
  starts_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_user_idx on public.appointments (user_id, starts_at);

-- One live visit of each kind per application.
create unique index appointments_one_per_kind
  on public.appointments (application_id, kind)
  where status in ('scheduled', 'completed');

-- A shelter cannot be booked twice at the same time.
create unique index appointments_slot_taken
  on public.appointments (shelter_id, starts_at)
  where status in ('scheduled', 'completed');

-- Business rules.
create or replace function public.enforce_appointment_rules()
returns trigger
language plpgsql
as $$
declare
  app_user uuid;
  app_status text;
  app_shelter uuid;
begin
  new.updated_at := now();

  if tg_op = 'UPDATE' then
    if new.application_id <> old.application_id
       or new.user_id <> old.user_id
       or new.shelter_id <> old.shelter_id
       or new.kind <> old.kind then
      raise exception 'appointment_locked_fields';
    end if;
    if new.starts_at <> old.starts_at and new.starts_at <= now() then
      raise exception 'slot_in_past';
    end if;
    return new;
  end if;

  select a.user_id, a.status, p.shelter_id
    into app_user, app_status, app_shelter
    from public.applications a
    join public.pets p on p.id = a.pet_id
   where a.id = new.application_id;

  if app_user is null or app_user <> new.user_id then
    raise exception 'application_not_found';
  end if;

  if app_status not in ('in_review', 'accepted') then
    raise exception 'application_not_open';
  end if;

  if new.starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  if new.kind = 'home' and not exists (
    select 1 from public.appointments m
     where m.application_id = new.application_id
       and m.kind = 'meet'
       and m.status = 'completed'
  ) then
    raise exception 'meet_not_completed';
  end if;

  new.shelter_id := app_shelter;
  return new;
end;
$$;

create trigger appointments_rules
  before insert or update on public.appointments
  for each row execute function public.enforce_appointment_rules();

-- Row level security: users only touch their own visits.
alter table public.appointments enable row level security;

create policy "appointments: select own"
  on public.appointments for select
  using (user_id = auth.uid());

create policy "appointments: insert own"
  on public.appointments for insert
  with check (user_id = auth.uid() and status = 'scheduled');

create policy "appointments: reschedule or cancel own"
  on public.appointments for update
  using (user_id = auth.uid() and status = 'scheduled')
  with check (user_id = auth.uid() and status in ('scheduled', 'cancelled'));

-- Cancelling or declining an application cancels its scheduled visits.
create or replace function public.cancel_visits_when_application_ends()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('cancelled', 'rejected')
     and old.status not in ('cancelled', 'rejected') then
    update public.appointments
       set status = 'cancelled'
     where application_id = new.id
       and status = 'scheduled';
  end if;
  return new;
end;
$$;

create trigger applications_end_visits
  after update on public.applications
  for each row execute function public.cancel_visits_when_application_ends();

-- Which times are already taken at a shelter (without exposing who booked them).
create or replace function public.taken_slots(
  p_shelter_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (starts_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.starts_at
    from public.appointments a
   where a.shelter_id = p_shelter_id
     and a.status in ('scheduled', 'completed')
     and a.starts_at >= p_from
     and a.starts_at < p_to
$$;

revoke all on function public.taken_slots(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.taken_slots(uuid, timestamptz, timestamptz) to authenticated;