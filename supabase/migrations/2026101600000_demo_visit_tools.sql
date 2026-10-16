-- Demo helper: lets the signed-in user "play the shelter" and mark their own
-- visits completed (or undo it). Same on/off switch as the application demo tools.

create or replace function public.demo_set_visit_status(
  p_appointment_id uuid,
  p_status text
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.appointments;
  result public.appointments;
begin
  if not coalesce(
    (select enabled from public.app_flags where key = 'demo_tools'),
    false
  ) then
    raise exception 'demo_tools_disabled';
  end if;

  if p_status not in ('scheduled', 'completed') then
    raise exception 'invalid_demo_status';
  end if;

  select * into existing
    from public.appointments
   where id = p_appointment_id
     and user_id = auth.uid()
     and status in ('scheduled', 'completed');

  if not found then
    raise exception 'appointment_not_found';
  end if;

  -- Undoing a meet and greet while a home visit exists would break the order.
  if p_status = 'scheduled' and existing.kind = 'meet' and exists (
    select 1 from public.appointments h
     where h.application_id = existing.application_id
       and h.kind = 'home'
       and h.status in ('scheduled', 'completed')
  ) then
    raise exception 'home_visit_exists';
  end if;

  update public.appointments
     set status = p_status
   where id = p_appointment_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.demo_set_visit_status(uuid, text) from public, anon;
grant execute on function public.demo_set_visit_status(uuid, text) to authenticated;