-- Phase 2 Stream 1: users, sessions, memberships, RLS, session RPCs.
-- Apply via Supabase Dashboard → SQL, or `supabase db push` when linked.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  initials text not null,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vibe_key text,
  invite_code text not null,
  host_user_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.memberships (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('host', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (session_id, user_id)
);

-- Invite codes are unique only among active sessions (reusable after end).
create unique index sessions_invite_code_active_idx
  on public.sessions (invite_code)
  where ended_at is null;

create index sessions_host_user_id_idx on public.sessions (host_user_id);
create index memberships_user_id_idx on public.memberships (user_id);

-- ---------------------------------------------------------------------------
-- Auth bootstrap: profile row on sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, initials)
  values (new.id, 'You', 'YOU')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code(p_group_name text)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  cleaned text;
  prefix text;
  charset constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  suffix text := '';
  i int;
  idx int;
begin
  cleaned := upper(regexp_replace(coalesce(p_group_name, ''), '[^A-Za-z]', '', 'g'));

  if length(cleaned) >= 4 then
    prefix := substr(cleaned, 1, 4);
  else
    prefix := substr(cleaned || 'NITE', 1, 4);
  end if;

  for i in 1..4 loop
    idx := 1 + floor(random() * length(charset))::int;
    suffix := suffix || substr(charset, idx, 1);
  end loop;

  return prefix || '-' || suffix;
end;
$$;

create or replace function public.member_hue(p_user_id uuid)
returns text
language sql
immutable
set search_path = public
as $$
  select (array[
    'electric', 'magenta', 'flame', 'amber',
    'mint', 'ice', 'violet', 'coral'
  ])[1 + (abs(hashtext(p_user_id::text)) % 8)];
$$;

create or replace function public.is_session_member(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.session_id = p_session_id
      and m.user_id = auth.uid()
      and m.left_at is null
  );
$$;

create or replace function public.is_session_host(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.session_id = p_session_id
      and m.user_id = auth.uid()
      and m.role = 'host'
      and m.left_at is null
  );
$$;

create or replace function public.ensure_user_profile(
  p_display_name text default 'You',
  p_initials text default 'YOU'
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.users;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.users (id, display_name, initials)
  values (
    v_user_id,
    coalesce(nullif(trim(p_display_name), ''), 'You'),
    coalesce(nullif(trim(p_initials), ''), 'YOU')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        initials = excluded.initials
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.build_session_payload(p_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_session public.sessions;
  v_members jsonb;
begin
  select * into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    raise exception 'Session not found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'name', u.display_name,
        'initials', u.initials,
        'hue', public.member_hue(u.id),
        'role', m.role,
        'joined_at', m.joined_at
      )
      order by m.joined_at
    ),
    '[]'::jsonb
  )
  into v_members
  from public.memberships m
  join public.users u on u.id = m.user_id
  where m.session_id = p_session_id
    and m.left_at is null;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'name', v_session.name,
      'vibe_key', v_session.vibe_key,
      'invite_code', v_session.invite_code,
      'host_user_id', v_session.host_user_id,
      'created_at', v_session.created_at,
      'ended_at', v_session.ended_at
    ),
    'members', v_members
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs (security definer — clients mutate sessions only through these)
-- ---------------------------------------------------------------------------

create or replace function public.create_session(
  p_name text,
  p_vibe_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.sessions;
  v_invite text;
  v_attempts int := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Session name is required';
  end if;

  perform public.ensure_user_profile();

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 20 then
      raise exception 'Could not generate unique invite code';
    end if;

    v_invite := public.generate_invite_code(p_name);

    exit when not exists (
      select 1
      from public.sessions s
      where s.invite_code = v_invite
        and s.ended_at is null
    );
  end loop;

  insert into public.sessions (name, vibe_key, invite_code, host_user_id)
  values (trim(p_name), p_vibe_key, v_invite, v_user_id)
  returning * into v_session;

  insert into public.memberships (session_id, user_id, role)
  values (v_session.id, v_user_id, 'host');

  return public.build_session_payload(v_session.id);
end;
$$;

create or replace function public.get_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_session_member(p_session_id) then
    raise exception 'Not a member of this session';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    raise exception 'Session not found';
  end if;

  if v_session.ended_at is not null then
    raise exception 'Session has ended';
  end if;

  return public.build_session_payload(p_session_id);
end;
$$;

create or replace function public.end_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions;
  v_ended_at timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_session_host(p_session_id) then
    raise exception 'Only the host can end this session';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    raise exception 'Session not found';
  end if;

  if v_session.ended_at is not null then
    raise exception 'Session has already ended';
  end if;

  update public.sessions
  set ended_at = v_ended_at
  where id = p_session_id;

  update public.memberships
  set left_at = v_ended_at
  where session_id = p_session_id
    and left_at is null;

  return jsonb_build_object(
    'session_id', p_session_id,
    'ended_at', v_ended_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.memberships enable row level security;

-- users: own profile only
create policy users_select_own
  on public.users
  for select
  to authenticated
  using (id = auth.uid());

create policy users_insert_own
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid());

create policy users_update_own
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- sessions: active sessions visible to members (reads via get_session RPC are primary)
create policy sessions_select_member_active
  on public.sessions
  for select
  to authenticated
  using (
    ended_at is null
    and public.is_session_member(id)
  );

-- memberships: visible to self or fellow active members of the same session
create policy memberships_select_member
  on public.memberships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_session_member(session_id)
  );

-- No direct insert/update/delete on sessions or memberships for clients.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update on public.users to authenticated;
grant select on public.sessions to authenticated;
grant select on public.memberships to authenticated;

grant execute on function public.ensure_user_profile(text, text) to authenticated;
grant execute on function public.create_session(text, text) to authenticated;
grant execute on function public.get_session(uuid) to authenticated;
grant execute on function public.end_session(uuid) to authenticated;
