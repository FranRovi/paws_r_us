-- When an application goes back to "pending" (the demo reset), it starts over:
-- remove its visits so old completed ones do not carry over.

create or replace function public.reset_visits_when_application_restarts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' and old.status <> 'pending' then
    delete from public.appointments
     where application_id = new.id;
  end if;
  return new;
end;
$$;

create trigger applications_restart_visits
  after update on public.applications
  for each row execute function public.reset_visits_when_application_restarts();