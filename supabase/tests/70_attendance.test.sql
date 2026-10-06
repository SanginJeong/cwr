-- 근태: 정책, 출퇴근, 휴가, 조회 권한 (ADR-007)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

-- 오늘 이후 n번째 평일 (KST)
create function pg_temp.weekday_after(p_n int) returns date language plpgsql as $$
declare d date := public.today_kst(); k int := 0;
begin
  loop
    d := d + 1;
    if extract(isodow from d) < 6 then k := k + 1; end if;
    exit when k = p_n;
  end loop;
  return d;
end $$;

create function pg_temp.next_saturday() returns date language sql as $$
  select public.today_kst() + ((6 - extract(isodow from public.today_kst())::int + 7) % 7 + case when extract(isodow from public.today_kst()) = 6 then 7 else 0 end);
$$;

grant execute on all functions in schema pg_temp to anon, authenticated;

do $$
declare
  hr bigint := public.test_signup('hr@test.com', '인사', p_company_role => 'HR_ADMIN');
  leader bigint := public.test_signup('leader@test.com', '팀장');
  member bigint := public.test_signup('member@test.com', '팀원');
  other_leader bigint := public.test_signup('other@test.com', '다른팀장');
  g bigint;
  other_g bigint;
  fixed_policy bigint;
  default_policy bigint;
  req bigint;
  req2 bigint;
  leader_req bigint;
  json jsonb;
  d1 date := pg_temp.weekday_after(1);
  d2 date := pg_temp.weekday_after(2);
begin
  g := public.test_create_team('개발팀', leader);
  perform public.test_add_member(g, member);
  other_g := public.test_create_team('디자인팀', other_leader);
  select id into default_policy from public.policies where is_default;

  -- ── 정책 ──
  perform pg_temp.check('기본 정책이 하나 있음 (자율 출퇴근)',
    (select count(*) from public.policies where is_default) = 1
    and (select type from public.policies where is_default) = 'AUTONOMOUS');

  perform public.test_login(member);
  perform pg_temp.check('직원: 정책 조회 가능', exists (select 1 from public.policies));
  perform pg_temp.check('직원: 정책 생성 불가', public.test_error(
    $q$insert into public.policies (name, type) values ('몰래', 'AUTONOMOUS')$q$) = '42501');
  perform pg_temp.check('직원: 본인 정책 배정 불가', public.test_error(format(
    'select public.set_employee_policy(%s, %s)', member, default_policy)) = '42501');
  perform pg_temp.check('직원: 정책 직접 변경 불가', public.test_error(format(
    'update public.profiles set policy_id = %s where id = %s', default_policy, member)) = '42501');

  perform public.test_login(hr);
  insert into public.policies (name, type, work_start, grace_minutes)
  values ('9시 고정', 'FIXED', '09:00', 10) returning id into fixed_policy;
  perform pg_temp.check('인사담당자: 정책 생성', fixed_policy is not null);
  perform pg_temp.check('코어타임은 시작·끝이 필요', public.test_error(
    $q$insert into public.policies (name, type) values ('x', 'CORE_TIME')$q$) = '23514');
  perform pg_temp.check('코어타임 시작이 끝보다 늦으면 거부', public.test_error(
    $q$insert into public.policies (name, type, core_start, core_end) values ('x', 'CORE_TIME', '16:00', '10:00')$q$) = '23514');
  perform pg_temp.check('유형에 안 쓰는 칸은 비워야 함', public.test_error(
    $q$insert into public.policies (name, type, work_start) values ('x', 'AUTONOMOUS', '09:00')$q$) = '23514');
  perform pg_temp.check('유예는 0~180분', public.test_error(
    $q$insert into public.policies (name, type, work_start, grace_minutes) values ('x', 'FIXED', '09:00', 200)$q$) = '23514');
  perform pg_temp.check('is_default는 직접 못 바꿈 (set_default_policy로)', public.test_error(format(
    'update public.policies set is_default = true where id = %s', fixed_policy)) = '42501');
  perform pg_temp.check('기본 정책은 삭제 불가', public.test_row_count(format(
    'delete from public.policies where id = %s', default_policy)) = 0);

  perform public.set_employee_policy(member, fixed_policy);
  perform pg_temp.check('쓰고 있는 정책은 삭제 불가', public.test_error(format(
    'delete from public.policies where id = %s', fixed_policy)) = '23001');

  perform public.set_default_policy(fixed_policy);
  perform public.test_logout();
  perform pg_temp.check('기본 정책 바꾸기: 하나만 기본', (select count(*) from public.policies where is_default) = 1
    and (select is_default from public.policies where id = fixed_policy));
  perform public.test_login(hr);
  perform public.set_default_policy(default_policy);

  -- ── 출퇴근 ──
  perform public.test_login(member);
  perform pg_temp.check('퇴근 전에 출근 기록이 없으면 거부', public.test_error('select public.clock_out()') = 'P0001');
  json := public.clock_in();
  perform pg_temp.check('출근: 오늘(KST) 날짜와 naive ISO 시각', json ->> 'date' = public.today_kst()::text
    and json ->> 'clockInAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$' and json ->> 'clockOutAt' is null);
  perform pg_temp.check('출근은 하루에 한 번', public.test_error('select public.clock_in()') = 'P0001');
  json := public.clock_out();
  perform pg_temp.check('퇴근 기록', json ->> 'clockOutAt' is not null);
  perform pg_temp.check('퇴근도 하루에 한 번', public.test_error('select public.clock_out()') = 'P0001');
  perform pg_temp.check('출퇴근 기록 직접 생성 불가', public.test_error(format(
    'insert into public.attendance_records (user_id, date, clock_in_at) values (%s, current_date - 1, now())', member)) = '42501');
  perform pg_temp.check('출퇴근 기록 직접 수정 불가', public.test_error(
    'update public.attendance_records set clock_in_at = now() - interval ''3 hours''') = '42501');

  -- ── 휴가 신청 ──
  perform pg_temp.check('오늘은 신청 불가', public.test_error(
    'select public.request_leave(public.today_kst())') = 'P0001');
  perform pg_temp.check('주말은 신청 불가', public.test_error(format(
    'select public.request_leave(%L)', pg_temp.next_saturday())) = 'P0001');
  json := public.request_leave(d1, ' 병원 ');
  req := (json ->> 'id')::bigint;
  perform pg_temp.check('신청: 대기 상태, 사유 앞뒤 공백 제거', json ->> 'status' = 'PENDING' and json ->> 'reason' = '병원');
  perform pg_temp.check('같은 날짜 중복 신청 불가', public.test_error(format(
    'select public.request_leave(%L)', d1)) = 'P0001');
  req2 := (public.request_leave(d2) ->> 'id')::bigint;
  perform pg_temp.check('휴가 신청 직접 생성 불가', public.test_error(format(
    'insert into public.leave_requests (user_id, date) values (%s, %L)', member, d2 + 7)) = '42501');
  perform pg_temp.check('본인 신청은 승인 불가', public.test_error(format(
    'select public.decide_leave(%s, true)', req)) = '42501');

  -- ── 승인 권한 ──
  perform public.test_login(other_leader);
  perform pg_temp.check('다른 팀 팀장: 신청이 안 보이고 승인 불가 (404)',
    not exists (select 1 from public.leave_requests where id = req)
    and public.test_error(format('select public.decide_leave(%s, true)', req)) = 'PT404');

  perform public.test_login(leader);
  perform pg_temp.check('팀장: 팀원 신청이 보임', exists (select 1 from public.leave_requests where id = req));
  json := public.decide_leave(req, true);
  perform pg_temp.check('팀장: 팀원 휴가 승인', json ->> 'status' = 'APPROVED' and (json ->> 'decidedBy')::bigint = leader);

  -- 먼저 처리한 결정이 적용된다 (PGlite는 연결이 하나라 순서대로 확인)
  perform public.test_login(hr);
  perform pg_temp.check('이미 승인된 신청은 다시 결정 불가 (먼저 처리한 결정 유지)', public.test_error(format(
    'select public.decide_leave(%s, false)', req)) = 'P0001');
  perform public.test_logout();
  perform pg_temp.check('먼저 처리한 결정 유지: 여전히 승인',
    (select status from public.leave_requests where id = req) = 'APPROVED');

  perform public.test_login(hr);
  perform pg_temp.check('인사담당자: 팀이 아니어도 반려 가능',
    public.decide_leave(req2, false) ->> 'status' = 'REJECTED');

  perform public.test_login(member);
  perform pg_temp.check('승인된 신청은 취소 불가', public.test_error(format('select public.cancel_leave(%s)', req)) = 'P0001');
  perform pg_temp.check('반려된 날짜는 다시 신청 가능', public.test_error(format(
    'select public.request_leave(%L)', d2)) is null);
  req2 := (select id from public.leave_requests where user_id = member and date = d2 and status = 'PENDING');
  perform public.cancel_leave(req2);
  perform pg_temp.check('대기 중인 신청은 취소(삭제)', not exists (select 1 from public.leave_requests where id = req2));
  perform pg_temp.check('없는 신청 취소는 404', public.test_error(format('select public.cancel_leave(%s)', req2)) = 'PT404');

  -- 신청자가 취소한 뒤 팀장이 결정하면 404
  req2 := (public.request_leave(d2) ->> 'id')::bigint;
  perform public.cancel_leave(req2);
  perform public.test_login(leader);
  perform pg_temp.check('취소된 신청 결정은 404', public.test_error(format(
    'select public.decide_leave(%s, true)', req2)) = 'PT404');

  -- 팀장 본인의 휴가: 같은 팀 팀원은 못 보고, 인사담당자가 승인
  leader_req := (public.request_leave(d2) ->> 'id')::bigint;
  perform public.test_login(member);
  perform pg_temp.check('팀원은 팀장의 휴가 신청을 못 봄', not exists (select 1 from public.leave_requests where id = leader_req));
  perform public.test_login(hr);
  perform pg_temp.check('팀장의 휴가는 인사담당자가 승인', public.decide_leave(leader_req, true) ->> 'status' = 'APPROVED');

  -- ── 엔진 입력 (attendance_range) ──
  perform public.test_logout();
  insert into public.attendance_records (user_id, date, clock_in_at, clock_out_at) values
    (member, date '2026-06-01', timestamptz '2026-06-01 09:05:00+09', timestamptz '2026-06-01 18:00:00+09'),
    -- KST 00:30 출근 = UTC로는 전날. 날짜·시각 모두 KST로 나와야 한다
    (member, date '2026-06-02', timestamptz '2026-06-01 15:30:00+00', null);
  insert into public.leave_requests (user_id, date, status, decided_by, decided_at) values
    (member, date '2026-06-03', 'APPROVED', hr, now()),
    (member, date '2026-06-04', 'REJECTED', hr, now());
  insert into public.leave_requests (user_id, date) values (member, date '2026-06-05');

  perform public.test_login(member);
  json := public.attendance_range('2026-06-01', '2026-06-07');
  perform pg_temp.check('본인 조회: 정책은 배정한 고정 정책',
    json -> 'policy' ->> 'type' = 'FIXED' and json -> 'policy' ->> 'workStart' = '09:00'
    and (json -> 'policy' ->> 'graceMinutes')::int = 10);
  perform pg_temp.check('today는 서버의 KST 날짜', json ->> 'today' = public.today_kst()::text);
  perform pg_temp.check('hiredOn: 새 계정은 등록한 날(KST)', json ->> 'hiredOn' = public.today_kst()::text);
  perform pg_temp.check('기록: WORK 2개 + 승인된 휴가만 LEAVE (반려·대기는 없음)',
    jsonb_array_length(json -> 'records') = 3
    and json -> 'records' -> 2 ->> 'kind' = 'LEAVE' and json -> 'records' -> 2 ->> 'date' = '2026-06-03');
  perform pg_temp.check('시각은 KST naive ISO',
    json -> 'records' -> 0 ->> 'clockInAt' = '2026-06-01T09:05:00'
    and json -> 'records' -> 0 ->> 'clockOutAt' = '2026-06-01T18:00:00'
    and json -> 'records' -> 1 ->> 'clockInAt' = '2026-06-02T00:30:00');
  perform pg_temp.check('기간이 거꾸로면 거부', public.test_error(
    $q$select public.attendance_range('2026-06-07', '2026-06-01')$q$) = 'P0001');
  perform pg_temp.check('93일 넘게는 거부', public.test_error(
    $q$select public.attendance_range('2026-01-01', '2026-06-01')$q$) = 'P0001');
  perform pg_temp.check('팀원: 팀장 기록 조회 불가 (404)', public.test_error(format(
    $q$select public.attendance_range('2026-06-01', '2026-06-07', %s)$q$, leader)) = 'PT404');
  perform pg_temp.check('팀원: 팀 근태 조회 불가', public.test_error(format(
    $q$select public.team_attendance_range(%s, '2026-06-01', '2026-06-07')$q$, g)) = '42501');

  perform public.test_login(leader);
  perform pg_temp.check('팀장: 팀원 기록 조회', public.attendance_range('2026-06-01', '2026-06-07', member) ->> 'userId' = member::text);
  perform pg_temp.check('팀장: 팀원 출퇴근 기록이 보임', exists (select 1 from public.attendance_records where user_id = member));
  json := public.team_attendance_range(g, '2026-06-01', '2026-06-07');
  perform pg_temp.check('팀장: 팀 근태 (멤버별 정책과 기록)', jsonb_array_length(json -> 'members') = 2
    and json -> 'members' -> 0 ->> 'userName' = '팀장' and json -> 'members' -> 1 -> 'policy' ->> 'type' = 'FIXED');
  perform pg_temp.check('정책이 없는 팀장은 기본 정책', json -> 'members' -> 0 -> 'policy' ->> 'type' = 'AUTONOMOUS');

  perform public.test_login(other_leader);
  perform pg_temp.check('다른 팀 팀장: 기록이 안 보이고 조회 불가', not exists (select 1 from public.attendance_records)
    and public.test_error(format($q$select public.attendance_range('2026-06-01', '2026-06-07', %s)$q$, member)) = 'PT404'
    and public.test_error(format($q$select public.team_attendance_range(%s, '2026-06-01', '2026-06-07')$q$, g)) = 'PT404');

  perform public.test_login(hr);
  perform pg_temp.check('인사담당자: 누구든 조회', public.attendance_range('2026-06-01', '2026-06-07', member) is not null
    and jsonb_array_length(public.team_attendance_range(g, '2026-06-01', '2026-06-07') -> 'members') = 2);
  perform pg_temp.check('인사담당자: 없는 직원은 404', public.test_error(
    $q$select public.attendance_range('2026-06-01', '2026-06-07', 999999)$q$) = 'PT404');

  -- ── 퇴사자 ──
  perform public.test_logout();
  update public.profiles set is_active = false where id = member;
  perform public.test_login(member);
  perform pg_temp.check('퇴사자: 출근 불가', public.test_error('select public.clock_in()') = '42501');
  perform pg_temp.check('퇴사자: 휴가 신청 불가', public.test_error(format('select public.request_leave(%L)', d1 + 7)) = '42501');
  perform public.test_login(leader);
  perform pg_temp.check('퇴사자는 팀 근태에서 빠짐',
    jsonb_array_length(public.team_attendance_range(g, '2026-06-01', '2026-06-07') -> 'members') = 1);
  perform public.test_login(hr);
  perform pg_temp.check('퇴사자 기록은 인사담당자가 계속 조회 (보존)',
    jsonb_array_length(public.attendance_range('2026-06-01', '2026-06-07', member) -> 'records') = 3);

  -- ── 비로그인 ──
  perform public.test_login(null);
  perform pg_temp.check('비로그인: 출근 불가', public.test_error('select public.clock_in()') = '42501');
  perform pg_temp.check('비로그인: 정책 조회 불가', public.test_error('select * from public.policies') = '42501');
  perform pg_temp.check('내부 함수 직접 호출 불가', public.test_error(format(
    $q$select public.attendance_range_json(%s, '2026-06-01', '2026-06-07')$q$, member)) = '42501');

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 55 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
