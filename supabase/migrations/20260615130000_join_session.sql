-- Phase 3 Stream 1: join_session RPC — invite validation + membership creation.

create or replace function public.join_session(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.sessions;
  v_code text := upper(trim(p_invite_code));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_code = '' then
    raise exception 'Invite code is required';
  end if;

  perform public.ensure_user_profile();

  select * into v_session
  from public.sessions
  where invite_code = v_code
    and ended_at is null;

  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  -- Idempotent re-join: already a member with open membership
  if exists (
    select 1 from public.memberships m
    where m.session_id = v_session.id
      and m.user_id = v_user_id
      and m.left_at is null
  ) then
    return public.build_session_payload(v_session.id);
  end if;

  insert into public.memberships (session_id, user_id, role)
  values (v_session.id, v_user_id, 'member');

  return public.build_session_payload(v_session.id);
end;
$$;

grant execute on function public.join_session(text) to authenticated;
