-- 인사담당자 화면: 구성원 관리, 근태 정책 (roadmap H5, ADR-006·007)
--
-- 구성원 목록에는 이메일·재직 여부·회사 역할·정책처럼 클라이언트에 열지 않은 칼럼이 필요하다.
-- 그래서 인사담당자만 호출할 수 있는 RPC로 모아서 준다.

create or replace function public.require_hr_admin()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
begin
  if not public.is_hr_admin() then
    raise exception '인사담당자만 이용할 수 있습니다.' using errcode = '42501';
  end if;
  return v_me;
end;
$$;

revoke execute on function public.require_hr_admin() from public, anon, authenticated;

-- 구성원 목록 (퇴사자 포함). 이번 달 판정용으로 [from, to] 근태(엔진 입력)를 함께 준다
create or replace function public.admin_employees(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_hr_admin();
  perform public.check_attendance_range(p_from, p_to);

  return jsonb_build_object(
    'today', public.today_kst(),
    'employees', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'userId', p.id,
          'nickname', p.nickname,
          'email', p.email,
          'image', p.image,
          'companyRole', p.company_role,
          'isActive', p.is_active,
          'hiredOn', p.hired_on,
          'policyId', p.policy_id,
          'memberships', (
            select coalesce(jsonb_agg(jsonb_build_object('groupId', g.id, 'groupName', g.name, 'role', m.role)
                                      order by g.name), '[]'::jsonb)
            from public.memberships m join public.groups g on g.id = m.group_id
            where m.user_id = p.id
          )
        ) || public.attendance_range_json(p.id, p_from, p_to)
        order by p.is_active desc, p.nickname), '[]'::jsonb)
      from public.profiles p
    )
  );
end;
$$;

revoke execute on function public.admin_employees(date, date) from public, anon;

-- 정보 수정: 이름, 입사일, 회사 역할. 넘기지 않은 값(null)은 그대로 둔다.
-- 본인의 인사담당자 역할은 내려놓을 수 없다 (인사담당자가 한 명도 없게 되는 것을 막는다)
create or replace function public.admin_update_employee(
  p_user_id      bigint,
  p_nickname     text default null,
  p_hired_on     date default null,
  p_company_role text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_hr_admin();
begin
  if p_user_id = v_me and p_company_role is not null and p_company_role <> 'HR_ADMIN' then
    raise exception '본인의 인사담당자 역할은 내려놓을 수 없습니다.';
  end if;
  if p_nickname is not null and exists (
    select 1 from public.profiles where nickname = trim(p_nickname) and id <> p_user_id
  ) then
    raise exception '이미 사용중인 이름입니다.';
  end if;

  update public.profiles set
    nickname     = coalesce(nullif(trim(p_nickname), ''), nickname),
    hired_on     = coalesce(p_hired_on, hired_on),
    company_role = coalesce(p_company_role, company_role)
  where id = p_user_id;
  if not found then
    raise exception '직원을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
end;
$$;

revoke execute on function public.admin_update_employee(bigint, text, date, text) from public, anon;

-- 정책 목록과 적용 인원 (재직자 기준, 정책이 없는 사람은 기본 정책으로 센다)
create or replace function public.admin_policies()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_hr_admin();

  return (
    select coalesce(jsonb_agg(
      public.policy_json(pol) || jsonb_build_object(
        'employeeCount', (
          select count(*) from public.profiles p
          where p.is_active
            and (p.policy_id = pol.id or (p.policy_id is null and pol.is_default))
        ),
        -- 직접 배정된 사람 수. 0명이고 기본 정책이 아니어야 지울 수 있다
        'assignedCount', (select count(*) from public.profiles p where p.policy_id = pol.id)
      )
      order by pol.is_default desc, pol.created_at), '[]'::jsonb)
    from public.policies pol
  );
end;
$$;

revoke execute on function public.admin_policies() from public, anon;
