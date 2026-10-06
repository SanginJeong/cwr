-- 권한 (ADR-004 §3)
-- 기존 API에 있던 권한 구멍(behavior-spec §4.1)이 새 백엔드에서는 막혀 있는지 하나씩 확인한다.
-- 결과는 test_results 테이블에 쌓고 마지막에 한 번에 검사한다 (실패한 항목을 모두 보려고).

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  admin bigint := public.test_signup('admin@test.com', '팀장');
  member bigint := public.test_signup('member@test.com', '팀원');
  outsider bigint := public.test_signup('out@test.com', '외부인');
  g bigint;
  list bigint;
  task bigint;
  admin_comment bigint;
begin
  -- 준비: 팀장과 팀원이 배정된 팀 (배정은 인사담당자가 한다. 15_company_roles에서 확인)
  g := public.test_create_team('개발팀', admin);
  perform public.test_add_member(g, member);
  perform public.test_login(admin);
  insert into public.task_lists (group_id, name) values (g, '할 일') returning id into list;
  perform public.create_recurring(list, '매일', 'DAILY');
  task := (public.tasks_for_date(list, public.today_kst()) -> 0 ->> 'id')::bigint;
  insert into public.task_comments (task_id, content) values (task, '팀장 댓글') returning id into admin_comment;

  -- ── 멤버가 아닌 사람 ──
  perform public.test_login(outsider);
  perform pg_temp.check('외부인: 그룹이 안 보임', not exists (select 1 from public.groups where id = g));
  perform pg_temp.check('외부인: get_group은 404', public.test_error(format('select public.get_group(%s)', g)) = 'PT404');
  perform pg_temp.check('외부인: 할 일 조회 404',
    public.test_error(format('select public.tasks_for_date(%s, null)', list)) = 'PT404');
  perform pg_temp.check('외부인: 댓글이 안 보임', not exists (select 1 from public.task_comments));
  perform pg_temp.check('외부인: 그룹 이름 수정 불가 (기존 API는 가능)',
    public.test_row_count(format('update public.groups set name = %L where id = %s', 'hack', g)) = 0);
  perform pg_temp.check('외부인: 할 일 목록 생성 불가 (기존 API는 가능)',
    public.test_error(format('insert into public.task_lists (group_id, name) values (%s, %L)', g, 'x')) = '42501');
  perform pg_temp.check('외부인: 할 일 완료 불가 (기존 API는 가능)',
    public.test_error(format('select public.update_task(%s, p_done => true)', task)) = 'PT404');
  perform pg_temp.check('외부인: 댓글 작성 불가 (기존 API는 가능)',
    public.test_error(format('insert into public.task_comments (task_id, content) values (%s, %L)', task, 'x')) = '42501');
  perform pg_temp.check('외부인: 반복 일정 생성 불가',
    public.test_error(format('select public.create_recurring(%s, %L, %L)', list, 'x', 'DAILY')) = 'PT404');

  -- ── 일반 멤버 ──
  perform public.test_login(member);
  perform pg_temp.check('멤버: 그룹 조회 가능', public.get_group(g) ->> 'name' = '개발팀');
  perform pg_temp.check('멤버: 그룹 수정 불가 (기존 API는 가능)',
    public.test_row_count(format('update public.groups set name = %L where id = %s', 'hack', g)) = 0);
  perform pg_temp.check('멤버: 그룹 삭제 불가 (기존 API는 가능)',
    public.test_row_count(format('delete from public.groups where id = %s', g)) = 0);
  perform pg_temp.check('멤버: 팀장 강퇴 불가 (기존 API는 가능)',
    public.test_row_count(format('delete from public.memberships where group_id = %s and user_id = %s', g, admin)) = 0);
  perform pg_temp.check('멤버: 할 일 목록 생성 가능',
    public.test_error(format('insert into public.task_lists (group_id, name) values (%s, %L)', g, '멤버 목록')) is null);
  perform pg_temp.check('멤버: 할 일 완료 가능',
    (public.update_task(task, p_done => true) -> 'doneBy' -> 'user' ->> 'id')::bigint = member);
  perform pg_temp.check('멤버: 남의 댓글 수정 불가',
    public.test_row_count(format('update public.task_comments set content = %L where id = %s', 'hack', admin_comment)) = 0);
  perform pg_temp.check('멤버: 남의 댓글 삭제 불가',
    public.test_row_count(format('delete from public.task_comments where id = %s', admin_comment)) = 0);
  perform pg_temp.check('멤버: 남의 이름으로 댓글 작성 불가',
    public.test_error(format('insert into public.task_comments (task_id, user_id, content) values (%s, %s, %L)',
                             task, admin, 'x')) = '42501');
  perform pg_temp.check('멤버: 직접 task 생성 불가 (RPC로만)',
    public.test_error(format('insert into public.tasks (recurring_id, task_list_id, date, name) values (1, %s, current_date, %L)',
                             list, 'x')) = '42501');
  perform pg_temp.check('멤버: 직접 task 수정 불가 (RPC로만)',
    public.test_error(format('update public.tasks set done_by = %s', admin)) = '42501');
  perform pg_temp.check('멤버: 다른 사람 프로필 수정 불가',
    public.test_row_count(format('update public.profiles set nickname = %L where id = %s', 'hack', admin)) = 0);
  perform pg_temp.check('멤버: 이메일 컬럼 직접 조회 불가',
    public.test_error('select email from public.profiles') = '42501');
  perform pg_temp.check('멤버: 내부 함수 직접 호출 불가',
    public.test_error(format('select public.user_json(%s)', admin)) = '42501');

  -- ── 팀장 ──
  perform public.test_login(admin);
  perform pg_temp.check('팀장: 그룹 수정 불가 (인사담당자만, ADR-006)',
    public.test_row_count(format('update public.groups set name = %L where id = %s', '개발1팀', g)) = 0);
  perform pg_temp.check('팀장: 멤버 내보내기 불가 (인사담당자만, ADR-006)',
    public.test_row_count(format('delete from public.memberships where group_id = %s and user_id = %s', g, member)) = 0);

  -- ── 비로그인 ──
  perform public.test_login(null);
  perform pg_temp.check('비로그인: 그룹 RPC 호출 불가',
    public.test_error(format('select public.get_group(%s)', g)) = '42501');
  perform pg_temp.check('비로그인: 그룹이 안 보임',
    public.test_error('select * from public.groups') = '42501');

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
end $$;
