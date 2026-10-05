-- 반복 일정과 할 일 RPC (ADR-004 §2)
--
-- task는 날짜를 조회할 때 반복 규칙으로 만들어진다. unique (recurring_id, date)로 멱등.
-- 응답은 프론트 타입과 같은 camelCase JSON. date는 KST 자정의 시각이다 (behavior-spec §1).

-- ───────────────────────── 규칙 ─────────────────────────

-- p_date에 이 반복 일정의 할 일이 있는가 (behavior-spec §2.2)
--   WEEKLY: 0 = 일요일
--   MONTHLY: 그 날짜가 없는 달은 건너뛴다 (31일 → 30일까지 있는 달에는 없음)
create or replace function public.occurs_on(p_recurring public.recurrings, p_date date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_date >= p_recurring.start_date and case p_recurring.frequency_type
    when 'ONCE'    then p_date = p_recurring.start_date
    when 'DAILY'   then true
    when 'WEEKLY'  then extract(dow from p_date)::smallint = any (p_recurring.week_days)
    when 'MONTHLY' then extract(day from p_date)::smallint = p_recurring.month_day
    else false
  end;
$$;

create or replace function public.kst_midnight(p_date date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select p_date::timestamp at time zone 'Asia/Seoul';
$$;

create or replace function public.user_json(p_user_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('id', p.id, 'nickname', p.nickname, 'image', p.image)
  from public.profiles p
  where p.id = p_user_id;
$$;

create or replace function public.task_json(p_task public.tasks)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_task.id,
    'name', p_task.name,
    'description', p_task.description,
    'date', public.kst_midnight(p_task.date),
    'doneAt', p_task.done_at,
    'updatedAt', p_task.updated_at,
    'deletedAt', p_task.deleted_at,
    'displayIndex', p_task.display_index,
    'recurringId', p_task.recurring_id,
    'frequency', r.frequency_type,
    'startDate', public.kst_midnight(r.start_date),
    'writer', public.user_json(p_task.writer_id),
    'doneBy', jsonb_build_object('user', public.user_json(p_task.done_by)),
    'user', public.user_json(p_task.done_by),
    'commentCount', (select count(*) from public.task_comments c where c.task_id = p_task.id)
  )
  from public.recurrings r
  where r.id = p_task.recurring_id;
$$;

create or replace function public.recurring_json(p_recurring public.recurrings)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_recurring.id,
    'name', p_recurring.name,
    'description', p_recurring.description,
    'startDate', public.kst_midnight(p_recurring.start_date),
    'frequencyType', p_recurring.frequency_type,
    'weekDays', to_jsonb(p_recurring.week_days),
    'monthDay', p_recurring.month_day,
    'taskListId', p_recurring.task_list_id,
    'groupId', p_recurring.group_id,
    'writerId', p_recurring.writer_id,
    'createdAt', p_recurring.created_at,
    'updatedAt', p_recurring.updated_at
  );
$$;

create or replace function public.require_task_list(p_task_list_id bigint)
returns public.task_lists
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_list public.task_lists;
begin
  perform public.require_login();
  select * into v_list from public.task_lists where id = p_task_list_id;
  if v_list.id is null or not public.is_member(v_list.group_id) then
    raise exception '할 일 목록을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  return v_list;
end;
$$;

create or replace function public.require_task(p_task_id bigint)
returns public.tasks
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  perform public.require_login();
  select * into v_task from public.tasks where id = p_task_id and deleted_at is null;
  if v_task.id is null or not public.can_access_task_list(v_task.task_list_id) then
    raise exception '할 일을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  return v_task;
end;
$$;

-- ───────────────────────── 조회 ─────────────────────────

-- GET .../task-lists/{id}/tasks?date: 그날의 task를 만들고(없으면) 돌려준다
create or replace function public.tasks_for_date(p_task_list_id bigint, p_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date := coalesce(p_date, public.today_kst());
begin
  perform public.require_task_list(p_task_list_id);

  insert into public.tasks (recurring_id, task_list_id, date, name, description, writer_id)
  select r.id, r.task_list_id, v_date, r.name, r.description, r.writer_id
  from public.recurrings r
  where r.task_list_id = p_task_list_id and public.occurs_on(r, v_date)
  on conflict (recurring_id, date) do nothing;

  return (
    select coalesce(jsonb_agg(public.task_json(t) order by t.display_index, t.id), '[]'::jsonb)
    from public.tasks t
    where t.task_list_id = p_task_list_id and t.date = v_date and t.deleted_at is null
  );
end;
$$;

create or replace function public.get_task(p_task_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return public.task_json(public.require_task(p_task_id));
end;
$$;

-- GET /user/history: 내가 완료한 할 일. 삭제된 것은 빼고 최근 완료 순 (ADR-004 §6)
create or replace function public.user_history()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('tasksDone', coalesce(jsonb_agg(public.task_json(t) order by t.done_at desc, t.id desc), '[]'::jsonb))
  from public.tasks t
  where t.done_by = public.require_login() and t.done_at is not null and t.deleted_at is null;
$$;

-- ───────────────────────── 반복 일정 ─────────────────────────

create or replace function public.create_recurring(
  p_task_list_id   bigint,
  p_name           text,
  p_frequency_type text,
  p_description    text default null,
  p_start_date     date default null,
  p_week_days      smallint[] default '{}',
  p_month_day      smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list public.task_lists := public.require_task_list(p_task_list_id);
  v_start date := coalesce(p_start_date, public.today_kst());
  v_recurring public.recurrings;
begin
  if v_start < public.today_kst() then
    raise exception '시작 날짜는 현재 날짜 이후여야 합니다.';
  end if;

  insert into public.recurrings
    (group_id, task_list_id, writer_id, name, description, start_date, frequency_type, week_days, month_day)
  values
    (v_list.group_id, v_list.id, public.current_profile_id(), p_name, p_description, v_start, p_frequency_type,
     coalesce(p_week_days, '{}'), p_month_day)
  returning * into v_recurring;

  return public.recurring_json(v_recurring);
end;
$$;

-- 반복 규칙 수정. 오늘 이후의 "손대지 않은" task에도 반영한다 (ADR-004 §2)
--   이름·설명만 바뀜: 그 task들의 이름·설명을 갱신
--   일정(빈도·요일·날짜·시작일)이 바뀜: 그 task들을 지운다. 다음 조회 때 새 규칙으로 다시 생긴다
-- "손대지 않은" = 완료 안 됨, 그 날짜만 직접 수정한 적 없음, 삭제 안 됨, 댓글 없음
create or replace function public.update_recurring(
  p_recurring_id   bigint,
  p_name           text default null,
  p_description    text default null,
  p_start_date     date default null,
  p_frequency_type text default null,
  p_week_days      smallint[] default null,
  p_month_day      smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.recurrings;
  v_new public.recurrings;
begin
  perform public.require_login();
  select * into v_old from public.recurrings where id = p_recurring_id;
  if v_old.id is null or not public.is_member(v_old.group_id) then
    raise exception '반복 일정을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if p_start_date is not null and p_start_date <> v_old.start_date and p_start_date < public.today_kst() then
    raise exception '시작 날짜는 현재 날짜 이후여야 합니다.';
  end if;

  update public.recurrings set
    name           = coalesce(p_name, name),
    description    = coalesce(p_description, description),
    start_date     = coalesce(p_start_date, start_date),
    frequency_type = coalesce(p_frequency_type, frequency_type),
    week_days      = coalesce(p_week_days, week_days),
    month_day      = coalesce(p_month_day, month_day)
  where id = p_recurring_id
  returning * into v_new;

  if (v_new.start_date, v_new.frequency_type, v_new.week_days, v_new.month_day)
     is distinct from (v_old.start_date, v_old.frequency_type, v_old.week_days, v_old.month_day) then
    delete from public.tasks t
    where t.recurring_id = p_recurring_id
      and t.date >= public.today_kst()
      and t.done_at is null and not t.is_customized and t.deleted_at is null
      and not exists (select 1 from public.task_comments c where c.task_id = t.id);
  end if;

  update public.tasks t
  set name = v_new.name, description = v_new.description
  where t.recurring_id = p_recurring_id
    and t.date >= public.today_kst()
    and t.done_at is null and not t.is_customized and t.deleted_at is null;

  return public.recurring_json(v_new);
end;
$$;

-- ───────────────────────── 할 일 ─────────────────────────

-- PATCH .../tasks/{id}: 이름·설명을 바꾸면 그 날짜만 바뀐다(is_customized). done이면 완료자는 요청한 사람
create or replace function public.update_task(
  p_task_id     bigint,
  p_name        text default null,
  p_description text default null,
  p_done        boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks := public.require_task(p_task_id);
begin
  update public.tasks set
    name          = coalesce(p_name, name),
    description   = coalesce(p_description, description),
    is_customized = is_customized or p_name is not null or p_description is not null,
    done_at       = case when p_done is null then done_at when p_done then coalesce(done_at, now()) end,
    done_by       = case when p_done is null then done_by when p_done then coalesce(done_by, public.current_profile_id()) end
  where id = v_task.id
  returning * into v_task;

  return public.task_json(v_task);
end;
$$;

-- DELETE .../tasks/{id}: 그 날짜만 지운다 (soft delete. 다시 조회해도 생기지 않는다)
create or replace function public.delete_task(p_task_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks := public.require_task(p_task_id);
begin
  update public.tasks set deleted_at = now() where id = v_task.id;
end;
$$;

revoke execute on function public.tasks_for_date(bigint, date) from public, anon;
revoke execute on function public.get_task(bigint) from public, anon;
revoke execute on function public.user_history() from public, anon;
revoke execute on function public.create_recurring(bigint, text, text, text, date, smallint[], smallint) from public, anon;
revoke execute on function public.update_recurring(bigint, text, text, date, text, smallint[], smallint) from public, anon;
revoke execute on function public.update_task(bigint, text, text, boolean) from public, anon;
revoke execute on function public.delete_task(bigint) from public, anon;
