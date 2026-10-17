-- Notifications: one row per thing the user should hear about.
-- Rows are created only by triggers; users can read, mark as read and delete their own.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('visit', 'status', 'message', 'heart')),
  body text not null check (char_length(body) between 1 and 300),
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_recent
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications select own" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications update own" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications delete own" on public.notifications
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- There is no INSERT policy on purpose: nobody can write their own notifications.

-- Users may only change read_at.
create or replace function public.lock_notification_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.kind is distinct from old.kind
     or new.body is distinct from old.body
     or new.link_path is distinct from old.link_path
     or new.created_at is distinct from old.created_at then
    raise exception 'notification_locked_fields';
  end if;
  return new;
end;
$$;

create trigger notifications_lock_fields
  before update on public.notifications
  for each row execute function public.lock_notification_fields();

-- Internal helper used by the triggers below. Not callable from the API.
create or replace function public.notify(
  p_user_id uuid,
  p_kind text,
  p_body text,
  p_link_path text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, body, link_path)
  values (p_user_id, p_kind, p_body, p_link_path);
$$;

revoke all on function public.notify(uuid, text, text, text) from public, anon, authenticated;

-- Applications: sent, and every status change.
create or replace function public.notify_application_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet text;
  v_shelter text;
  v_body text;
begin
  select p.name, s.name into v_pet, v_shelter
  from public.pets p
  join public.shelters s on s.id = p.shelter_id
  where p.id = new.pet_id;

  if tg_op = 'INSERT' then
    v_body := format('Your application for %s was sent to %s.', v_pet, v_shelter);
  elsif new.status is distinct from old.status then
    v_body := case new.status
      when 'in_review' then format('%s is reviewing your application for %s.', v_shelter, v_pet)
      when 'accepted' then format('Good news! %s accepted your application for %s.', v_shelter, v_pet)
      when 'rejected' then format('%s could not move forward with your application for %s.', v_shelter, v_pet)
      when 'cancelled' then format('You cancelled your application for %s.', v_pet)
      else null
    end;
  end if;

  if v_body is not null then
    perform public.notify(new.user_id, 'status', v_body, '/adoptions');
  end if;
  return null;
end;
$$;

create trigger applications_notify
  after insert or update of status on public.applications
  for each row execute function public.notify_application_change();

-- Visits: booked, moved, completed, cancelled.
-- The text has no dates on purpose: the database does not know the user's time zone.
create or replace function public.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet text;
  v_app_status text;
  v_label text;
  v_body text;
begin
  select p.name, a.status into v_pet, v_app_status
  from public.applications a
  join public.pets p on p.id = a.pet_id
  where a.id = new.application_id;

  v_label := case new.kind when 'meet' then 'meet and greet' else 'home visit' end;

  if tg_op = 'INSERT' then
    v_body := format('Your %s with %s is booked.', v_label, v_pet);
  elsif new.status = 'scheduled' and old.status = 'scheduled'
        and new.starts_at is distinct from old.starts_at then
    v_body := format('Your %s with %s was moved to a new time.', v_label, v_pet);
  elsif new.status = 'completed' and old.status is distinct from 'completed' then
    v_body := format('Your %s with %s is marked as completed.', v_label, v_pet);
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled'
        and v_app_status not in ('cancelled', 'rejected') then
    -- When the whole application ends, the visits are cancelled with it
    -- and the application notification already says so.
    v_body := format('You cancelled your %s with %s.', v_label, v_pet);
  end if;

  if v_body is not null then
    perform public.notify(new.user_id, 'visit', v_body, '/appointments');
  end if;
  return null;
end;
$$;

create trigger appointments_notify
  after insert or update on public.appointments
  for each row execute function public.notify_appointment_change();

-- Favorites: "You saved X". Skipped if the same one was sent in the last hour,
-- so tapping the heart on and off does not fill the list.
create or replace function public.notify_favorite_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet text;
  v_body text;
begin
  select name into v_pet from public.pets where id = new.pet_id;
  v_body := format('You saved %s to your favorites.', v_pet);

  if not exists (
    select 1 from public.notifications
    where user_id = new.user_id
      and kind = 'heart'
      and body = v_body
      and created_at > now() - interval '1 hour'
  ) then
    perform public.notify(new.user_id, 'heart', v_body, '/favorites');
  end if;
  return null;
end;
$$;

create trigger favorites_notify
  after insert on public.favorites
  for each row execute function public.notify_favorite_added();

-- Welcome message when the profile is created at sign-up.
create or replace function public.notify_welcome()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(
    new.id,
    'status',
    'Welcome to Paws R Us! Complete your profile so shelters can get to know you.',
    '/profile'
  );
  return null;
end;
$$;

create trigger profiles_welcome
  after insert on public.profiles
  for each row execute function public.notify_welcome();