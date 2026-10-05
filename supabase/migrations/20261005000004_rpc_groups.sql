-- 그룹, 멤버, 초대, 내 정보 RPC
-- 중첩된 응답(get_me, get_group)은 프론트 타입(src/shared/api/types)과 같은 camelCase JSON으로 돌려준다.
--
-- 에러 코드 (PostgREST가 HTTP 상태로 바꾼다)
--   42501 → 403 권한 없음
--   P0002 → 404 없음 (멤버가 아닌 그룹도 404. 존재 여부를 노출하지 않는다. 기존 API와 같음)
--   P0001 → 400 규칙 위반

create or replace function public.require_login()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.current_profile_id();
begin
  if v_me is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;
  return v_me;
end;
$$;

create or replace function public.group_json(p_group public.groups)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_group.id,
    'name', p_group.name,
    'image', p_group.image,
    'createdAt', p_group.created_at,
    'updatedAt', p_group.updated_at
  );
$$;

create or replace function public.member_json(p_membership public.memberships, p_profile public.profiles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'userId', p_profile.id,
    'groupId', p_membership.group_id,
    'userName', p_profile.nickname,
    'userEmail', p_profile.email,
    'userImage', p_profile.image,
    'role', p_membership.role
  );
$$;

-- ───────────────────────── 그룹 ─────────────────────────

create or replace function public.create_group(p_name text, p_image text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_group public.groups;
begin
  insert into public.groups (name, image) values (p_name, p_image) returning * into v_group;
  insert into public.memberships (group_id, user_id, role) values (v_group.id, v_me, 'ADMIN');
  return public.group_json(v_group);
end;
$$;

-- GET /groups/{id}: 멤버 목록과 오늘(KST)의 할 일 목록·할 일을 함께 (behavior-spec §2.7)
create or replace function public.get_group(p_group_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups;
  v_task_lists jsonb;
begin
  perform public.require_login();
  if not public.is_member(p_group_id) then
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  select * into v_group from public.groups where id = p_group_id;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id', tl.id,
             'name', tl.name,
             'groupId', tl.group_id,
             'displayIndex', tl.display_index,
             'createdAt', tl.created_at,
             'updatedAt', tl.updated_at,
             'tasks', public.tasks_for_date(tl.id, public.today_kst())
           ) order by tl.display_index, tl.id), '[]'::jsonb)
  into v_task_lists
  from public.task_lists tl
  where tl.group_id = p_group_id;

  return public.group_json(v_group) || jsonb_build_object(
    'members', (select coalesce(jsonb_agg(public.member_json(m, p) order by m.created_at), '[]'::jsonb)
                from public.memberships m join public.profiles p on p.id = m.user_id
                where m.group_id = p_group_id),
    'taskLists', v_task_lists
  );
end;
$$;

-- 본인 탈퇴 (ADR-004 §4)
create or replace function public.leave_group(p_group_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_role text;
begin
  select role into v_role from public.memberships where group_id = p_group_id and user_id = v_me;
  if v_role is null then
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.memberships where group_id = p_group_id and user_id <> v_me) then
    raise exception '그룹에 유일한 멤버는 탈퇴할 수 없습니다. 그룹을 삭제해주세요.';
  end if;
  if v_role = 'ADMIN' and not exists (
    select 1 from public.memberships where group_id = p_group_id and user_id <> v_me and role = 'ADMIN'
  ) then
    raise exception '관리자는 다른 멤버에게 관리자를 넘긴 뒤 탈퇴할 수 있습니다.';
  end if;
  delete from public.memberships where group_id = p_group_id and user_id = v_me;
end;
$$;

-- ───────────────────────── 초대 (ADR-004 §5) ─────────────────────────

-- 유효한 토큰이 있으면 그대로 돌려준다 (여러 명이 같은 링크를 쓴다. 기존 API와 같음)
create or replace function public.create_invitation(p_group_id bigint)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_token text;
begin
  if not public.is_member(p_group_id) then
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if not public.is_admin(p_group_id) then
    raise exception '관리자만 초대할 수 있습니다.' using errcode = '42501';
  end if;

  select token into v_token
  from public.invitations
  where group_id = p_group_id and expires_at > now() + interval '1 hour'
  order by expires_at desc
  limit 1;

  if v_token is null then
    insert into public.invitations (group_id, created_by) values (p_group_id, v_me) returning token into v_token;
  end if;
  return v_token;
end;
$$;

-- 로그인한 본인만 들어간다. 이메일을 받지 않는다 (behavior-spec §4.3의 구멍)
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_group_id bigint;
begin
  select group_id into v_group_id from public.invitations where token = p_token and expires_at > now();
  if v_group_id is null then
    raise exception '유효하지 않거나 만료된 초대 링크입니다.';
  end if;
  if exists (select 1 from public.memberships where group_id = v_group_id and user_id = v_me) then
    raise exception '이미 그룹에 소속된 유저입니다.';
  end if;
  insert into public.memberships (group_id, user_id, role) values (v_group_id, v_me, 'MEMBER');
  return jsonb_build_object('groupId', v_group_id);
end;
$$;

-- ───────────────────────── 내 정보 ─────────────────────────

-- GET /user: 프로필 + memberships[].group
create or replace function public.get_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me public.profiles;
begin
  select * into v_me from public.profiles where id = public.require_login();
  return jsonb_build_object(
    'id', v_me.id,
    'email', v_me.email,
    'nickname', v_me.nickname,
    'image', v_me.image,
    'createdAt', v_me.created_at,
    'updatedAt', v_me.updated_at,
    'memberships', (
      select coalesce(jsonb_agg(public.member_json(m, v_me) || jsonb_build_object('group', public.group_json(g))
                                order by m.created_at), '[]'::jsonb)
      from public.memberships m join public.groups g on g.id = m.group_id
      where m.user_id = v_me.id
    )
  );
end;
$$;

revoke execute on function public.create_group(text, text) from public, anon;
revoke execute on function public.get_group(bigint) from public, anon;
revoke execute on function public.leave_group(bigint) from public, anon;
revoke execute on function public.create_invitation(bigint) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;
revoke execute on function public.get_me() from public, anon;
