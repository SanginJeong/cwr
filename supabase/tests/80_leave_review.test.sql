-- 휴가 승인 목록과 팀 휴가 달력 (20261006000008_leave_review)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  hr bigint := public.test_signup('hr@test.com', '인사', p_company_role => 'HR_ADMIN');
  leader bigint := public.test_signup('leader@test.com', '팀장');
  a bigint := public.test_signup('a@test.com', '에이');
  b bigint := public.test_signup('b@test.com', '비');
  leaver bigint := public.test_signup('leaver@test.com', '퇴사자');
  outsider bigint := public.test_signup('out@test.com', '다른팀원');
  g bigint;
  other_g bigint;
  json jsonb;
begin
  g := public.test_create_team('개발팀', leader);
  perform public.test_add_member(g, a);
  perform public.test_add_member(g, b);
  perform public.test_add_member(g, leaver);
  other_g := public.test_create_team('디자인팀');
  perform public.test_add_member(other_g, outsider);

  -- 같은 날(10/23) 에이·비가 신청, 퇴사자도 신청, 다른 팀원도 같은 날 신청
  insert into public.leave_requests (user_id, date, reason, created_at) values
    (a, date '2026-10-23', '가족 행사', now() - interval '2 hours'),
    (b, date '2026-10-23', '이사', now() - interval '1 hour'),
    (b, date '2026-10-20', null, now()),
    (leaver, date '2026-10-21', null, now()),
    (outsider, date '2026-10-23', null, now()),
    (leader, date '2026-10-22', '팀장 휴가', now());
  insert into public.leave_requests (user_id, date, status, decided_by, decided_at) values
    (a, date '2026-10-02', 'APPROVED', leader, now() - interval '1 day'),
    (b, date '2026-10-05', 'REJECTED', hr, now());
  update public.profiles set is_active = false where id = leaver;

  -- ── 팀장 ──
  perform public.test_login(leader);
  json := public.review_leave_requests(true);
  perform pg_temp.check('팀장 대기 목록: 팀원 3건 (본인·퇴사자·다른 팀 제외)', jsonb_array_length(json) = 3);
  perform pg_temp.check('대기 목록은 휴가 날짜·신청 순',
    json -> 0 ->> 'date' = '2026-10-20' and json -> 1 ->> 'userName' = '에이' and json -> 2 ->> 'userName' = '비');
  perform pg_temp.check('응답에 신청자 이름·사유·소속 팀',
    json -> 1 ->> 'reason' = '가족 행사' and json -> 1 -> 'teams' = '["개발팀"]'::jsonb);
  perform pg_temp.check('겹침: 같은 팀의 같은 날 휴가만 (다른 팀원 제외)',
    json -> 1 -> 'overlaps' = '[{"userName": "비", "status": "PENDING"}]'::jsonb
    and jsonb_array_length(json -> 0 -> 'overlaps') = 0);

  json := public.review_leave_requests(false);
  perform pg_temp.check('처리됨: 최근 처리 순, 처리한 사람 이름',
    jsonb_array_length(json) = 2 and json -> 0 ->> 'status' = 'REJECTED' and json -> 0 ->> 'decidedByName' = '인사'
    and json -> 1 ->> 'decidedByName' = '팀장');

  json := public.team_leave_calendar(g, '2026-10-01', '2026-10-31');
  perform pg_temp.check('팀 달력: 대기·승인만, 퇴사자 제외 (반려 제외)',
    jsonb_array_length(json -> 'leaves') = 5
    and not exists (select 1 from jsonb_array_elements(json -> 'leaves') e where e ->> 'userName' = '퇴사자')
    and not exists (select 1 from jsonb_array_elements(json -> 'leaves') e where e ->> 'status' = 'REJECTED'));
  perform pg_temp.check('팀 달력: 팀장 본인 휴가도 보임',
    exists (select 1 from jsonb_array_elements(json -> 'leaves') e where e ->> 'userName' = '팀장'));
  perform pg_temp.check('팀 달력: 다른 팀은 404', public.test_error(format(
    $q$select public.team_leave_calendar(%s, '2026-10-01', '2026-10-31')$q$, other_g)) = 'PT404');

  -- ── 직원 ──
  perform public.test_login(a);
  perform pg_temp.check('직원: 승인 목록은 비어 있음', jsonb_array_length(public.review_leave_requests(true)) = 0);
  perform pg_temp.check('직원: 팀 달력 불가', public.test_error(format(
    $q$select public.team_leave_calendar(%s, '2026-10-01', '2026-10-31')$q$, g)) = '42501');

  -- ── 인사담당자 ──
  perform public.test_login(hr);
  json := public.review_leave_requests(true);
  perform pg_temp.check('인사담당자: 회사 전체 대기 (퇴사자 제외, 팀장 휴가 포함)', jsonb_array_length(json) = 5
    and exists (select 1 from jsonb_array_elements(json) e where e ->> 'userName' = '팀장'));
  perform pg_temp.check('인사담당자: 어느 팀이든 달력', jsonb_array_length(
    public.team_leave_calendar(other_g, '2026-10-01', '2026-10-31') -> 'leaves') = 1);

  -- ── 비로그인 ──
  perform public.test_login(null);
  perform pg_temp.check('비로그인: 승인 목록 불가', public.test_error('select public.review_leave_requests()') = '42501');
  perform pg_temp.check('내부 함수 직접 호출 불가', public.test_error(format(
    'select public.can_decide_leave_of(%s)', a)) = '42501');

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 14 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
