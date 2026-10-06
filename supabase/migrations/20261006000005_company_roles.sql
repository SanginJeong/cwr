-- 회사 역할과 계정 (ADR-006, roadmap H1)
--
-- 회사 하나 안에 역할이 세 단계다.
--   인사담당자: profiles.company_role = 'HR_ADMIN'. 직원 등록, 팀 생성·수정·삭제, 멤버 배정, 퇴사 처리
--   팀장      : memberships.role = 'ADMIN' (기존 값 그대로). H2부터 팀원 휴가 승인
--   직원      : 그 외
-- 계정은 인사담당자가 만든다 (BFF가 service role로 auth.admin.createUser). 공개 가입과 초대 링크는 없앤다.

-- ───────────────────────── profiles ─────────────────────────

alter table public.profiles
  add column company_role text not null default 'EMPLOYEE' check (company_role in ('HR_ADMIN', 'EMPLOYEE')),
  -- 기존 계정은 활성으로 둔다
  add column is_active boolean not null default true;

-- 새로 생기는 계정은 비활성으로 시작한다. 직원 등록 BFF가 service role로 활성화한다.
-- 대시보드에서 공개 가입을 끄지 않았더라도, 스스로 가입한 계정은 아무것도 할 수 없다 (current_profile_id가 null).
alter table public.profiles alter column is_active set default false;

-- company_role, is_active는 클라이언트에 update 권한을 주지 않는다 (service role 또는 아래 RPC로만)

-- ───────────────────────── 헬퍼 ─────────────────────────

-- 퇴사(비활성) 계정은 로그인 상태여도 "로그인하지 않은 사람"으로 본다.
-- 모든 RLS와 RPC가 이 함수를 거치므로 한 곳에서 막힌다. 기록(할 일, 댓글, 근태)은 그대로 남는다.
create or replace function public.current_profile_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles where auth_id = auth.uid() and is_active;
$$;

create or replace function public.is_hr_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_profile_id() and company_role = 'HR_ADMIN'
  );
$$;

-- RLS 정책에서 쓰므로 authenticated는 실행할 수 있어야 한다 (BFF도 권한 확인에 쓴다)
revoke execute on function public.is_hr_admin() from public, anon;

-- is_active 컬럼은 클라이언트에 열지 않았으므로 정책에서는 이 함수로 확인한다
create or replace function public.is_active_profile(p_profile_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = p_profile_id and is_active);
$$;

revoke execute on function public.is_active_profile(bigint) from public, anon;

-- 인사담당자는 모든 팀을 멤버처럼 본다 (사이드바에 전체 팀, 팀 페이지·할 일·게시판 접근).
-- is_member를 쓰는 모든 정책과 RPC에 한 번에 적용된다. 팀장 권한(is_admin)은 주지 않는다.
create or replace function public.is_member(p_group_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_hr_admin() or exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = public.current_profile_id()
  );
$$;

-- ───────────────────────── groups ─────────────────────────
-- 팀 생성·수정·삭제는 인사담당자만 (기존: 만든 사람이 ADMIN이 되고, ADMIN이 수정·삭제)

drop policy "groups: ADMIN만 수정" on public.groups;
drop policy "groups: ADMIN만 삭제" on public.groups;

create policy "groups: 인사담당자만 수정" on public.groups
  for update to authenticated using (public.is_hr_admin()) with check (public.is_hr_admin());
create policy "groups: 인사담당자만 삭제" on public.groups
  for delete to authenticated using (public.is_hr_admin());

-- 만든 사람(인사담당자)을 멤버로 넣지 않는다. 팀장과 팀원은 따로 배정한다
create or replace function public.create_group(p_name text, p_image text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups;
begin
  perform public.require_login();
  if not public.is_hr_admin() then
    raise exception '인사담당자만 팀을 만들 수 있습니다.' using errcode = '42501';
  end if;
  insert into public.groups (name, image) values (p_name, p_image) returning * into v_group;
  return public.group_json(v_group);
end;
$$;

-- ───────────────────────── memberships ─────────────────────────
-- 배정(추가), 팀장 지정(role 변경), 해제는 인사담당자만. 팀장도 팀원을 내보낼 수 없다

drop policy "memberships: ADMIN이 MEMBER만 강퇴" on public.memberships;

grant insert (group_id, user_id, role) on public.memberships to authenticated;
grant update (role) on public.memberships to authenticated;

create policy "memberships: 인사담당자만 배정" on public.memberships
  for insert to authenticated
  with check (public.is_hr_admin() and public.is_active_profile(user_id));
create policy "memberships: 인사담당자만 역할 변경" on public.memberships
  for update to authenticated using (public.is_hr_admin()) with check (public.is_hr_admin());
create policy "memberships: 인사담당자만 해제" on public.memberships
  for delete to authenticated using (public.is_hr_admin());

-- 팀 나가기, 회원 탈퇴는 없앤다. 배정은 인사담당자가 하고, 퇴사는 비활성화로 처리해 기록을 남긴다
drop function public.leave_group(bigint);
drop function public.delete_account();

-- ───────────────────────── 초대 ─────────────────────────

drop function public.create_invitation(bigint);
drop function public.accept_invitation(text);
drop table public.invitations;

-- ───────────────────────── 퇴사 처리 ─────────────────────────
-- 로그인 차단(Auth ban)은 BFF가 service role로 한다. 그 사용자의 auth id를 돌려준다.
-- DB 쪽은 current_profile_id가 비활성 계정을 막으므로 ban이 실패해도 아무것도 할 수 없다.

create or replace function public.set_employee_active(p_user_id bigint, p_active boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_auth_id uuid;
begin
  if not public.is_hr_admin() then
    raise exception '인사담당자만 퇴사 처리할 수 있습니다.' using errcode = '42501';
  end if;
  if p_user_id = v_me then
    raise exception '본인 계정은 퇴사 처리할 수 없습니다.';
  end if;
  update public.profiles set is_active = p_active where id = p_user_id returning auth_id into v_auth_id;
  if v_auth_id is null then
    raise exception '직원을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  return v_auth_id;
end;
$$;

revoke execute on function public.set_employee_active(bigint, boolean) from public, anon;

-- ───────────────────────── 응답 ─────────────────────────

-- 팀 멤버 목록에서 퇴사자를 뺀다 (멤버십 행은 남아 있다)
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
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'PT404';
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
                where m.group_id = p_group_id and p.is_active),
    'taskLists', v_task_lists
  );
end;
$$;

-- get_me에 companyRole 추가
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
    'companyRole', v_me.company_role,
    'presenceStatus', v_me.presence_status,
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
