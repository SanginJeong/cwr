-- 인사담당자 화면 RPC: 구성원 목록, 정보 수정, 정책 목록 (20261006000009_admin)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  hr bigint := public.test_signup('hr@test.com', '인사', p_company_role => 'HR_ADMIN');
  leader bigint := public.test_signup('leader@test.com', '팀장');
  member bigint := public.test_signup('member@test.com', '팀원');
  leaver bigint := public.test_signup('leaver@test.com', '퇴사자');
  g bigint;
  fixed_policy bigint;
  default_policy bigint;
  json jsonb;
  row_json jsonb;
begin
  g := public.test_create_team('개발팀', leader);
  perform public.test_add_member(g, member);
  select id into default_policy from public.policies where is_default;
  insert into public.policies (name, type, work_start, grace_minutes) values ('9시 고정', 'FIXED', '09:00', 10)
  returning id into fixed_policy;
  update public.profiles set policy_id = fixed_policy where id = member;
  update public.profiles set is_active = false, policy_id = fixed_policy where id = leaver;
  insert into public.attendance_records (user_id, date, clock_in_at)
  values (member, date '2026-06-01', timestamptz '2026-06-01 09:20:00+09');

  -- ── 직원·팀장은 호출 불가 ──
  perform public.test_login(leader);
  perform pg_temp.check('팀장: 구성원 목록 불가', public.test_error(
    $q$select public.admin_employees('2026-06-01', '2026-06-30')$q$) = '42501');
  perform pg_temp.check('팀장: 정보 수정 불가', public.test_error(format(
    'select public.admin_update_employee(%s, %L)', member, '해커')) = '42501');
  perform pg_temp.check('팀장: 정책 목록 RPC 불가', public.test_error('select public.admin_policies()') = '42501');

  -- ── 구성원 목록 ──
  perform public.test_login(hr);
  json := public.admin_employees('2026-06-01', '2026-06-30');
  perform pg_temp.check('구성원 목록: 퇴사자 포함 전원, 재직자 먼저', jsonb_array_length(json -> 'employees') = 4
    and json -> 'employees' -> 3 ->> 'nickname' = '퇴사자');
  select e into row_json from jsonb_array_elements(json -> 'employees') e where (e ->> 'userId')::bigint = member;
  perform pg_temp.check('구성원: 이메일·역할·재직·입사일·정책·소속 팀',
    row_json ->> 'email' = 'member@test.com' and row_json ->> 'companyRole' = 'EMPLOYEE'
    and (row_json ->> 'isActive')::boolean and row_json ->> 'hiredOn' is not null
    and (row_json ->> 'policyId')::bigint = fixed_policy
    and row_json -> 'memberships' = format('[{"groupId": %s, "groupName": "개발팀", "role": "MEMBER"}]', g)::jsonb);
  perform pg_temp.check('구성원: 엔진 입력(정책·기록)도 함께',
    row_json -> 'policy' ->> 'type' = 'FIXED' and jsonb_array_length(row_json -> 'records') = 1);

  -- ── 정보 수정 ──
  perform public.admin_update_employee(member, '새이름', date '2026-01-02', null);
  perform public.test_logout();
  perform pg_temp.check('정보 수정: 이름·입사일, 역할은 그대로',
    (select nickname = '새이름' and hired_on = date '2026-01-02' and company_role = 'EMPLOYEE'
     from public.profiles where id = member));
  perform public.test_login(hr);
  perform pg_temp.check('이름 중복은 거부', public.test_error(format(
    'select public.admin_update_employee(%s, %L)', member, '팀장')) = 'P0001');
  perform pg_temp.check('본인의 인사담당자 역할은 내려놓을 수 없음', public.test_error(format(
    'select public.admin_update_employee(%s, null, null, %L)', hr, 'EMPLOYEE')) = 'P0001');
  perform pg_temp.check('잘못된 역할은 거부', public.test_error(format(
    'select public.admin_update_employee(%s, null, null, %L)', member, 'CEO')) = '23514');
  perform pg_temp.check('없는 직원은 404', public.test_error(
    'select public.admin_update_employee(999999, ''x'')') = 'PT404');
  perform public.admin_update_employee(leader, null, null, 'HR_ADMIN');
  perform public.test_logout();
  perform pg_temp.check('다른 사람을 인사담당자로 지정',
    (select company_role from public.profiles where id = leader) = 'HR_ADMIN');

  -- ── 정책 목록 ──
  perform public.test_login(hr);
  json := public.admin_policies();
  perform pg_temp.check('정책 목록: 기본 정책 먼저', jsonb_array_length(json) = 2
    and (json -> 0 ->> 'isDefault')::boolean and (json -> 0 ->> 'id')::bigint = default_policy);
  perform pg_temp.check('적용 인원: 재직자, 정책 없는 사람은 기본 정책 (인사·팀장 = 2명)',
    (json -> 0 ->> 'employeeCount')::int = 2 and (json -> 1 ->> 'employeeCount')::int = 1);
  perform pg_temp.check('직접 배정 수는 퇴사자 포함 (지울 수 있는지 판단용)', (json -> 1 ->> 'assignedCount')::int = 2);

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 15 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
