-- Messages: one conversation per user and pet, plus the messages inside it.
-- Users write their own messages. Shelter messages exist only through the demo function.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_one_per_pet unique (user_id, pet_id)
);

create index conversations_user_recent
  on public.conversations (user_id, last_message_at desc);

alter table public.conversations enable row level security;

create policy "conversations select own" on public.conversations
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "conversations insert own" on public.conversations
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- The shelter always comes from the pet, never from the client.
create or replace function public.enforce_conversation_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.shelter_id into new.shelter_id
  from public.pets p
  where p.id = new.pet_id;

  if new.shelter_id is null then
    raise exception 'pet_not_found';
  end if;

  new.last_message_at := now();
  return new;
end;
$$;

create trigger conversations_enforce_rules
  before insert on public.conversations
  for each row execute function public.enforce_conversation_rules();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sender text not null check (sender in ('user', 'shelter')),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index messages_conversation_time
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "messages select own" on public.messages
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Users can only add messages as themselves, to their own conversations.
create policy "messages insert own as user" on public.messages
  for insert to authenticated
  with check (sender = 'user' and user_id = (select auth.uid()));

-- No update or delete policies: messages cannot be edited or removed.

-- The owner comes from the conversation, so it cannot be forged.
create or replace function public.enforce_message_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select c.user_id into v_owner
  from public.conversations c
  where c.id = new.conversation_id;

  if v_owner is null then
    raise exception 'conversation_not_found';
  end if;

  new.user_id := v_owner;
  new.created_at := now();
  return new;
end;
$$;

create trigger messages_enforce_rules
  before insert on public.messages
  for each row execute function public.enforce_message_rules();

-- After each message: bump the conversation, and tell the user about shelter replies.
create or replace function public.after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pet text;
  v_shelter text;
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;

  if new.sender = 'shelter' then
    select p.name, s.name into v_pet, v_shelter
    from public.conversations c
    join public.pets p on p.id = c.pet_id
    join public.shelters s on s.id = c.shelter_id
    where c.id = new.conversation_id;

    perform public.notify(
      new.user_id,
      'message',
      format('%s replied to your message about %s.', v_shelter, v_pet),
      '/messages?conversation=' || new.conversation_id
    );
  end if;
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.after_message_insert();

-- Demo tool: plays the shelter, since there is no shelter back office.
create or replace function public.demo_shelter_reply(
  p_conversation_id uuid,
  p_body text default null
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_replies text[] := array[
    'Thanks for your message! We will get back to you shortly.',
    'Great question. Yes, and we would be happy to tell you more at a visit.',
    'Hi there! The pet is doing well and is very friendly.',
    'Thank you for your interest. Feel free to schedule a meet and greet.'
  ];
  v_message public.messages;
begin
  if not coalesce(
    (select enabled from public.app_flags where key = 'demo_tools'),
    false
  ) then
    raise exception 'demo_tools_disabled';
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.user_id = (select auth.uid())
  ) then
    raise exception 'conversation_not_found';
  end if;

  insert into public.messages (conversation_id, sender, body)
  values (
    p_conversation_id,
    'shelter',
    coalesce(
      nullif(btrim(p_body), ''),
      v_replies[1 + floor(random() * array_length(v_replies, 1))::int]
    )
  )
  returning * into v_message;

  return v_message;
end;
$$;

revoke all on function public.demo_shelter_reply(uuid, text) from public, anon;
grant execute on function public.demo_shelter_reply(uuid, text) to authenticated;

-- New messages reach the app live.
alter publication supabase_realtime add table public.messages;