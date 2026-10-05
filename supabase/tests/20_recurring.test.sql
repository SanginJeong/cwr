-- 반복 일정과 할 일 (behavior-spec §2, ADR-004 §2)
-- 날짜는 오늘(KST) 기준 상대값으로 쓴다. 시작일은 오늘 이후만 허용되기 때문.

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

-- 그 날짜의 task 이름 목록 (조회하면서 생성됨)
create function pg_temp.names(p_list bigint, p_date date) returns text language sql as $$
  select coalesce(string_agg(t ->> 'name', ',' order by t ->> 'name'), '')
  from jsonb_array_elements(public.tasks_for_date(p_list, p_date)) t;
$$;

create function pg_temp.task_id(p_list bigint, p_date date, p_name text) returns bigint language sql as $$
  select (t ->> 'id')::bigint
  from jsonb_array_elements(public.tasks_for_date(p_list, p_date)) t
  where t ->> 'name' = p_name;
$$;

do $$
declare
  me bigint := public.test_signup('me@test.com', '나');
  today date := public.today_kst();
  g bigint;
  list bigint;
  r_once bigint;
  r_daily bigint;
  r_weekly bigint;
  r_monthly bigint;
  d date;
  t1 bigint;
  t2 bigint;
  t3 bigint;
  t4 bigint;
  json jsonb;
  ok boolean;
begin
  perform public.test_login(me);
  g := (public.create_group('팀') ->> 'id')::bigint;
  insert into public.task_lists (group_id, name) values (g, '목록') returning id into list;

  -- ── 생성 ──
  json := public.create_recurring(list, '한번', 'ONCE');
  r_once := (json ->> 'id')::bigint;
  perform pg_temp.check('생성 응답은 recurring 객체', json ->> 'frequencyType' = 'ONCE' and json ? 'taskListId');
  perform pg_temp.check('시작일 생략 시 오늘', (json ->> 'startDate')::timestamptz = public.kst_midnight(today));
  perform pg_temp.check('과거 시작일은 거부',
    public.test_error(format('select public.create_recurring(%s, %L, %L, p_start_date => %L)',
                             list, 'x', 'DAILY', today - 1)) = 'P0001');
  perform pg_temp.check('WEEKLY인데 요일이 없으면 거부',
    public.test_error(format('select public.create_recurring(%s, %L, %L)', list, 'x', 'WEEKLY')) = '23514');
  perform pg_temp.check('MONTHLY인데 날짜가 없으면 거부',
    public.test_error(format('select public.create_recurring(%s, %L, %L)', list, 'x', 'MONTHLY')) = '23514');

  r_daily := (public.create_recurring(list, '매일', 'DAILY', p_start_date => today + 1) ->> 'id')::bigint;
  r_weekly := (public.create_recurring(list, '일수', 'WEEKLY', p_week_days => '{0,3}') ->> 'id')::bigint;
  r_monthly := (public.create_recurring(list, '31일', 'MONTHLY', p_month_day => 31::smallint) ->> 'id')::bigint;

  -- ── 펼침 규칙 ──
  perform pg_temp.check('ONCE: 시작일에만', pg_temp.names(list, today) like '%한번%'
                                          and pg_temp.names(list, today + 1) not like '%한번%');
  perform pg_temp.check('DAILY: 시작일 전에는 없음', pg_temp.names(list, today) not like '%매일%');
  perform pg_temp.check('DAILY: 시작일부터 매일', pg_temp.names(list, today + 1) like '%매일%'
                                              and pg_temp.names(list, today + 2) like '%매일%');

  ok := true;
  for i in 0..13 loop
    d := today + i;
    if (pg_temp.names(list, d) like '%일수%') <> (extract(dow from d) in (0, 3)) then ok := false; end if;
  end loop;
  perform pg_temp.check('WEEKLY: 0=일요일, 3=수요일에만', ok);

  ok := true;
  for i in 0..400 loop
    d := today + i;
    if public.occurs_on((select r from public.recurrings r where id = r_monthly), d)
       <> (extract(day from d) = 31) then ok := false; end if;
  end loop;
  perform pg_temp.check('MONTHLY 31일: 31일이 있는 달에만 (말일로 당기지 않음)', ok);

  -- ── 멱등 ──
  t1 := pg_temp.task_id(list, today + 1, '매일');
  perform pg_temp.check('같은 날짜를 다시 조회하면 같은 id', pg_temp.task_id(list, today + 1, '매일') = t1);
  perform pg_temp.check('같은 날짜에 행은 하나',
    (select count(*) from public.tasks where recurring_id = r_daily and date = today + 1) = 1);

  -- ── 응답 형태 ──
  json := public.get_task(t1);
  perform pg_temp.check('date는 KST 자정', (json ->> 'date')::timestamptz = public.kst_midnight(today + 1));
  perform pg_temp.check('task 응답에 프론트가 쓰는 필드',
    json ?& array['id', 'name', 'description', 'date', 'doneAt', 'updatedAt', 'deletedAt', 'displayIndex',
                  'recurringId', 'frequency', 'writer', 'doneBy', 'commentCount']);
  perform pg_temp.check('작성자', (json -> 'writer' ->> 'id')::bigint = me);
  perform pg_temp.check('상세에 recurring 포함 (groupId, taskListId)',
    (json -> 'recurring' ->> 'groupId')::bigint = g and (json -> 'recurring' ->> 'taskListId')::bigint = list);
  perform pg_temp.check('get_group에 오늘 할 일 포함',
    jsonb_array_length(public.get_group(g) -> 'taskLists' -> 0 -> 'tasks') = 1);

  -- ── 하루만 수정 ──
  t2 := pg_temp.task_id(list, today + 2, '매일');
  t3 := pg_temp.task_id(list, today + 3, '매일');
  t4 := pg_temp.task_id(list, today + 4, '매일');
  perform public.update_task(t1, p_name => '1일차만');
  perform pg_temp.check('task 하나를 수정하면 그 날짜만 바뀜',
    pg_temp.names(list, today + 1) like '%1일차만%' and pg_temp.names(list, today + 2) like '%매일%');

  -- ── 완료 ──
  json := public.update_task(t3, p_done => true);
  perform pg_temp.check('완료하면 doneAt과 완료자', json ->> 'doneAt' is not null
                                                  and (json -> 'doneBy' -> 'user' ->> 'id')::bigint = me);
  perform pg_temp.check('완료한 할 일이 history에', public.user_history() -> 'tasksDone' -> 0 ->> 'id' = t3::text);
  insert into public.task_comments (task_id, content) values (t4, '댓글');

  -- ── 반복 규칙 수정: 이름 ──
  perform public.update_recurring(r_daily, p_name => '매일v2');
  perform pg_temp.check('규칙 이름 수정: 이미 만들어진 미래 task에도 반영 (기존 API는 미반영)',
    (select name from public.tasks where id = t2) = '매일v2');
  perform pg_temp.check('규칙 이름 수정: 직접 수정한 날짜는 유지', (select name from public.tasks where id = t1) = '1일차만');
  perform pg_temp.check('규칙 이름 수정: 완료한 task는 유지', (select name from public.tasks where id = t3) = '매일');
  perform pg_temp.check('규칙 이름 수정: 처음 조회하는 날짜는 새 이름', pg_temp.names(list, today + 10) like '%매일v2%');

  -- ── 반복 규칙 수정: 일정 ──
  perform public.update_recurring(r_daily, p_frequency_type => 'WEEKLY', p_week_days => '{1}');
  perform pg_temp.check('일정 변경: 손대지 않은 미래 task는 지워짐', not exists (select 1 from public.tasks where id = t2));
  perform pg_temp.check('일정 변경: 완료·직접 수정·댓글 달린 task는 유지',
    (select count(*) from public.tasks where id in (t1, t3, t4)) = 3);
  ok := true;
  for i in 5..18 loop
    d := today + i;
    if (pg_temp.names(list, d) like '%매일v2%') <> (extract(dow from d) = 1) then ok := false; end if;
  end loop;
  perform pg_temp.check('일정 변경: 이후 조회는 새 규칙(월요일)으로', ok);

  -- ── 삭제 ──
  d := today;
  t1 := pg_temp.task_id(list, d, '한번');
  perform public.update_task(t1, p_done => true);
  perform public.delete_task(t1);
  perform pg_temp.check('task 삭제: 그 날짜에서 사라지고 다시 생기지 않음', pg_temp.names(list, d) not like '%한번%');
  perform pg_temp.check('task 삭제: 단건 조회 404', public.test_error(format('select public.get_task(%s)', t1)) = 'P0002');
  perform pg_temp.check('task 삭제: history에서 빠짐 (ADR-004 §6)',
    not exists (select 1 from jsonb_array_elements(public.user_history() -> 'tasksDone') h where (h ->> 'id')::bigint = t1));

  perform public.update_task(t3, p_done => false);
  perform pg_temp.check('완료 취소: history에서 빠지고 완료자 없음',
    jsonb_array_length(public.user_history() -> 'tasksDone') = 0
    and public.get_task(t3) -> 'doneBy' -> 'user' = 'null'::jsonb);

  delete from public.recurrings where id = r_daily;
  perform pg_temp.check('반복 일정 삭제: 연결된 task 모두 삭제', not exists (select 1 from public.tasks where recurring_id = r_daily));

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 30 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
