-- On/off switches for demo-only features. RLS is on and there are no
-- policies, so the app cannot read or write this table; only the
-- function below looks at it.
create table public.app_flags (
  key text primary key,
  enabled boolean not null default false
);

alter table public.app_flags enable row level security;

insert into public.app_flags (key, enabled) values ('demo_tools', true);

-- Plays the shelter's part: moves one of YOUR active applications to a new status.
create or replace function public.demo_set_application_status(
  p_application_id uuid,
  p_status text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.applications;
begin
  if not exists (
    select 1 from public.app_flags where key = 'demo_tools' and enabled
  ) then
    raise exception 'demo_tools_disabled';
  end if;

  if p_status not in ('pending', 'in_review', 'accepted', 'rejected') then
    raise exception 'invalid_demo_status';
  end if;

  update public.applications
  set status = p_status
  where id = p_application_id
    and user_id = auth.uid()
    and status in ('pending', 'in_review', 'accepted')
  returning * into target;

  if not found then
    raise exception 'application_not_found';
  end if;

  return target;
end;
$$;

revoke execute on function public.demo_set_application_status(uuid, text)
  from public, anon;
grant execute on function public.demo_set_application_status(uuid, text)
  to authenticated;