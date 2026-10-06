-- 역할별 권한: 인사담당자 / 팀장 / 직원 / 퇴사자 (ADR-006)

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
  newbie bigint := public.test_signup('new@test.com', '신입');
  leaver bigint := public.test_signup('leaver@test.com', '퇴사자');
  g bigint;
  other_g bigint;
  list bigint;
  leaver_auth uuid;
begin
  g := public.test_create_team('개발팀', leader);
  perform public.test_add_member(g, member);
  perform public.test_add_member(g, leaver);
  other_g := public.test_create_team('디자인팀');

  -- ── 직원 ──
  perform public.test_login(member);
  perform pg_temp.check('직원: 팀 생성 불가', public.test_error($q$select public.create_group('몰래팀')$q$) = '42501');
  perform pg_temp.check('직원: 다른 팀은 안 보임', not exists (select 1 from public.groups where id = other_g));
  perform pg_temp.check('직원: 멤버 배정 불가', public.test_error(format(
    'insert into public.memberships (group_id, user_id) values (%s, %s)', g, newbie)) = '42501');
  perform pg_temp.check('직원: 본인을 팀장으로 바꾸기 불가', public.test_row_count(format(
    'update public.memberships set role = %L where group_id = %s and user_id = %s', 'ADMIN', g, member)) = 0);
  perform pg_temp.check('직원: 회사 역할 직접 변경 불가', public.test_error(format(
    'update public.profiles set company_role = %L where id = %s', 'HR_ADMIN', member)) = '42501');
  perform pg_temp.check('직원: 본인 활성 상태 직접 변경 불가', public.test_error(format(
    'update public.profiles set is_active = true where id = %s', member)) = '42501');
  perform pg_temp.check('직원: 퇴사 처리 불가', public.test_error(format(
    'select public.set_employee_active(%s, false)', leaver)) = '42501');
  perform pg_temp.check('직원: is_hr_admin은 false', not public.is_hr_admin());

  -- ── 팀장 ──
  perform public.test_login(leader);
  perform pg_temp.check('팀장: 팀 생성 불가', public.test_error($q$select public.create_group('몰래팀')$q$) = '42501');
  perform pg_temp.check('팀장: 팀 이름 수정 불가', public.test_row_count(format(
    'update public.groups set name = %L where id = %s', 'x', g)) = 0);
  perform pg_temp.check('팀장: 팀 삭제 불가', public.test_row_count(format(
    'delete from public.groups where id = %s', g)) = 0);
  perform pg_temp.check('팀장: 팀원 내보내기 불가', public.test_row_count(format(
    'delete from public.memberships where group_id = %s and user_id = %s', g, member)) = 0);
  perform pg_temp.check('팀장: 팀원 추가 불가', public.test_error(format(
    'insert into public.memberships (group_id, user_id) values (%s, %s)', g, newbie)) = '42501');
  perform pg_temp.check('팀장: 팀 할 일은 그대로 사용', public.test_error(format(
    'insert into public.task_lists (group_id, name) values (%s, %L)', g, '팀장 목록')) is null);
  perform pg_temp.check('팀장: 다른 팀은 안 보임', not exists (select 1 from public.groups where id = other_g));

  -- ── 인사담당자 ──
  perform public.test_login(hr);
  perform pg_temp.check('인사담당자: 모든 팀이 보임',
    (select count(*) from public.groups where id in (g, other_g)) = 2);
  perform pg_temp.check('인사담당자: 소속이 아니어도 팀 페이지 조회', public.get_group(other_g) ->> 'name' = '디자인팀');
  perform pg_temp.check('인사담당자: 모든 팀의 멤버십이 보임',
    (select count(*) from public.memberships where group_id = g) = 3);
  perform pg_temp.check('인사담당자: 팀 이름 수정', public.test_row_count(format(
    'update public.groups set name = %L where id = %s', '디자인1팀', other_g)) = 1);
  perform pg_temp.check('인사담당자: 멤버 배정', public.test_error(format(
    'insert into public.memberships (group_id, user_id) values (%s, %s)', other_g, newbie)) is null);
  perform pg_temp.check('인사담당자: 팀장 지정', public.test_row_count(format(
    'update public.memberships set role = %L where group_id = %s and user_id = %s', 'ADMIN', other_g, newbie)) = 1);
  perform pg_temp.check('인사담당자: 배정 해제', public.test_row_count(format(
    'delete from public.memberships where group_id = %s and user_id = %s', other_g, newbie)) = 1);
  perform pg_temp.check('인사담당자: 팀장 권한(공지 지정 등)은 없음', not public.is_admin(g));
  perform pg_temp.check('인사담당자: 본인 퇴사 처리 불가', public.test_error(format(
    'select public.set_employee_active(%s, false)', hr)) = 'P0001');
  perform pg_temp.check('인사담당자: 없는 직원은 404', public.test_error(
    'select public.set_employee_active(999999, false)') = 'PT404');
  perform pg_temp.check('인사담당자: 팀 삭제', public.test_row_count(format(
    'delete from public.groups where id = %s', other_g)) = 1);

  -- ── 퇴사 처리 ──
  leaver_auth := public.set_employee_active(leaver, false);
  perform public.test_logout();
  perform pg_temp.check('퇴사 처리: Auth 차단에 쓸 auth id를 돌려줌',
    leaver_auth = (select auth_id from public.profiles where id = leaver));

  perform public.test_login(leader);
  perform pg_temp.check('퇴사자: 팀 멤버 목록에서 빠짐',
    jsonb_array_length(public.get_group(g) -> 'members') = 2);

  perform public.test_login(leaver);
  perform pg_temp.check('퇴사자: get_me 불가 (로그인 안 한 것과 같음)', public.test_error('select public.get_me()') = '42501');
  perform pg_temp.check('퇴사자: 팀이 안 보임', not exists (select 1 from public.groups where id = g));
  perform pg_temp.check('퇴사자: 게시글 작성 불가', public.test_error(
    $q$insert into public.articles (title, content) values ('t', 'c')$q$) = '42501');

  perform public.test_logout();
  perform pg_temp.check('퇴사자: 프로필과 멤버십은 남음 (기록 보존)',
    exists (select 1 from public.profiles where id = leaver)
    and exists (select 1 from public.memberships where group_id = g and user_id = leaver));

  perform public.test_login(hr);
  other_g := (public.create_group('새팀') ->> 'id')::bigint;
  perform pg_temp.check('퇴사자는 새 팀에 배정 불가', public.test_error(format(
    'insert into public.memberships (group_id, user_id) values (%s, %s)', other_g, leaver)) = '42501');
  perform public.set_employee_active(leaver, true);
  perform public.test_login(leaver);
  perform pg_temp.check('복직: 다시 활성화하면 원래 팀으로', public.is_member(g));

  -- ── 비로그인 ──
  perform public.test_login(null);
  perform pg_temp.check('비로그인: is_hr_admin 호출 불가', public.test_error('select public.is_hr_admin()') = '42501');
  perform pg_temp.check('비로그인: 퇴사 처리 호출 불가', public.test_error(format(
    'select public.set_employee_active(%s, false)', member)) = '42501');

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 35 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
