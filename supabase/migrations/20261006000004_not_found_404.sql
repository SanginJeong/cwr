-- "없음" 에러를 HTTP 404로 응답하게 한다.
--
-- PostgREST는 P0002(no_data_found)를 HTTP 500으로 돌려준다. 프론트는 코드로 판단해서 동작은 맞았지만
-- 브라우저 콘솔·모니터링에는 서버 에러로 찍혔다 (예: 할 일을 지운 직후 열려 있던 상세 패널이 다시 조회할 때).
-- PostgREST 전용 코드 PT404는 HTTP 404가 된다. 아래 함수들의 본문은 errcode만 바뀌었다.

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
                where m.group_id = p_group_id),
    'taskLists', v_task_lists
  );
end;
$$;

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
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'PT404';
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
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'PT404';
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
    raise exception '할 일 목록을 찾을 수 없습니다.' using errcode = 'PT404';
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
    raise exception '할 일을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  return v_task;
end;
$$;

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
    raise exception '반복 일정을 찾을 수 없습니다.' using errcode = 'PT404';
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

create or replace function public.set_team_post_notice(p_post_id bigint, p_is_notice boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id bigint := public.team_post_group_id(p_post_id);
begin
  perform public.require_login();
  if v_group_id is null or not public.is_member(v_group_id) then
    raise exception '게시글을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  if not public.is_admin(v_group_id) then
    raise exception '관리자만 공지를 지정할 수 있습니다.' using errcode = '42501';
  end if;
  update public.team_posts set is_notice = p_is_notice where id = p_post_id;
end;
$$;
