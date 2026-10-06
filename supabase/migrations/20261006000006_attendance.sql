-- 근태: 정책, 출퇴근 기록, 휴가 신청 (ADR-007, roadmap H2)
--
-- 판정(정시·지각·결근·휴가)은 저장하지 않는다. 정책 엔진(src/entities/attendance/lib/policy-engine)이
-- attendance_range가 돌려주는 기록과 정책으로 매번 계산한다. 정책을 바꾸면 지난 기록도 다시 판정된다.
--
-- 권한
--   본인 기록: 본인 / 팀원 기록: 같은 팀의 팀장 / 전체: 인사담당자
--   출퇴근·휴가 쓰기는 RPC로만 (시각은 서버가 정한다)

-- ───────────────────────── 정책 ─────────────────────────

create table public.policies (
  id             bigint generated always as identity primary key,
  name           text not null check (char_length(name) between 1 and 50),
  type           text not null check (type in ('AUTONOMOUS', 'CORE_TIME', 'FIXED')),
  core_start     time,
  core_end       time,
  work_start     time,
  grace_minutes  smallint,
  -- 정책이 없는 직원에게 적용된다. 하나만 있다
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint policies_core_time check (
    type <> 'CORE_TIME' or (core_start is not null and core_end is not null and core_start < core_end)
  ),
  constraint policies_fixed check (
    type <> 'FIXED' or (work_start is not null and grace_minutes between 0 and 180)
  ),
  -- 유형에 쓰지 않는 칸은 비워 둔다 (유형을 바꿨을 때 예전 값이 남지 않게)
  constraint policies_unused_null check (
    (type = 'CORE_TIME' or (core_start is null and core_end is null))
    and (type = 'FIXED' or (work_start is null and grace_minutes is null))
  )
);
create unique index policies_one_default on public.policies (is_default) where is_default;

create trigger set_updated_at before update on public.policies
  for each row execute function public.set_updated_at();

insert into public.policies (name, type, is_default) values ('자율 출퇴근', 'AUTONOMOUS', true);

-- 직원의 정책. null이면 기본 정책. 쓰고 있는 정책은 지울 수 없다
alter table public.profiles add column policy_id bigint references public.policies (id) on delete restrict;
create index profiles_policy_id_idx on public.profiles (policy_id);

-- ───────────────────────── 출퇴근 기록 ─────────────────────────

create table public.attendance_records (
  id            bigint generated always as identity primary key,
  user_id       bigint not null references public.profiles (id) on delete cascade,
  -- KST 날짜
  date          date not null,
  clock_in_at   timestamptz not null,
  clock_out_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, date),
  constraint attendance_records_out_after_in check (clock_out_at is null or clock_out_at >= clock_in_at)
);

-- ───────────────────────── 휴가 신청 ─────────────────────────

create table public.leave_requests (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references public.profiles (id) on delete cascade,
  date        date not null,
  status      text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reason      text check (char_length(reason) <= 200),
  decided_by  bigint references public.profiles (id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint leave_requests_decided check ((status = 'PENDING') = (decided_at is null))
);
-- 반려된 날짜는 다시 신청할 수 있다. 대기·승인은 하루에 하나
create unique index leave_requests_one_active on public.leave_requests (user_id, date)
  where status in ('PENDING', 'APPROVED');
create index leave_requests_date_idx on public.leave_requests (date);
create index leave_requests_pending_idx on public.leave_requests (created_at) where status = 'PENDING';

create trigger set_updated_at before update on public.leave_requests
  for each row execute function public.set_updated_at();

-- ───────────────────────── 헬퍼 ─────────────────────────

-- 내가 그 사람이 속한 팀의 팀장인지. 본인은 제외 (팀장의 휴가는 인사담당자나 같은 팀의 다른 팀장이 승인)
create or replace function public.is_team_leader_of(p_user_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id <> public.current_profile_id() and exists (
    select 1
    from public.memberships target
    join public.memberships leader on leader.group_id = target.group_id
    where target.user_id = p_user_id
      and leader.user_id = public.current_profile_id()
      and leader.role = 'ADMIN'
  );
$$;

create or replace function public.can_view_attendance(p_user_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = public.current_profile_id() or public.is_hr_admin() or public.is_team_leader_of(p_user_id);
$$;

-- RLS 정책에서 쓰므로 authenticated는 실행할 수 있어야 한다
revoke execute on function public.is_team_leader_of(bigint) from public, anon;
revoke execute on function public.can_view_attendance(bigint) from public, anon;

-- 정책 → 엔진의 Policy 모양 (src/entities/attendance/lib/policy-engine/types.ts)
create or replace function public.policy_json(p_policy public.policies)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object('id', p_policy.id, 'name', p_policy.name, 'isDefault', p_policy.is_default, 'type', p_policy.type)
    || case p_policy.type
         when 'CORE_TIME' then jsonb_build_object(
           'coreStart', to_char(p_policy.core_start, 'HH24:MI'),
           'coreEnd', to_char(p_policy.core_end, 'HH24:MI'))
         when 'FIXED' then jsonb_build_object(
           'workStart', to_char(p_policy.work_start, 'HH24:MI'),
           'graceMinutes', p_policy.grace_minutes)
         else '{}'::jsonb
       end;
$$;

-- 그 직원에게 적용되는 정책 (없으면 기본 정책)
create or replace function public.effective_policy(p_user_id bigint)
returns public.policies
language sql
stable
security definer
set search_path = ''
as $$
  select pol.* from public.policies pol
  where pol.id = coalesce((select policy_id from public.profiles where id = p_user_id),
                          (select id from public.policies where is_default));
$$;

-- timestamptz → 엔진이 받는 KST naive ISO ("YYYY-MM-DDTHH:mm:ss")
create or replace function public.kst_naive_iso(p_at timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select to_char(p_at at time zone 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS');
$$;

create or replace function public.attendance_record_json(p_record public.attendance_records)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'date', p_record.date,
    'clockInAt', public.kst_naive_iso(p_record.clock_in_at),
    'clockOutAt', public.kst_naive_iso(p_record.clock_out_at)
  );
$$;

create or replace function public.leave_request_json(p_request public.leave_requests)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_request.id,
    'userId', p_request.user_id,
    'date', p_request.date,
    'status', p_request.status,
    'reason', p_request.reason,
    'decidedBy', p_request.decided_by,
    'decidedAt', p_request.decided_at,
    'createdAt', p_request.created_at
  );
$$;

revoke execute on function public.effective_policy(bigint) from public, anon, authenticated;
revoke execute on function public.kst_naive_iso(timestamptz) from public, anon, authenticated;
revoke execute on function public.policy_json(public.policies) from public, anon, authenticated;
revoke execute on function public.attendance_record_json(public.attendance_records) from public, anon, authenticated;
revoke execute on function public.leave_request_json(public.leave_requests) from public, anon, authenticated;

-- ───────────────────────── 권한 ─────────────────────────

revoke all on public.policies, public.attendance_records, public.leave_requests from anon, authenticated;

-- 정책: 직원은 모두 읽는다 (내 판정 규칙 보기). 만들기·수정·삭제는 인사담당자. 기본 정책 지정은 set_default_policy
alter table public.policies enable row level security;
grant select, delete on public.policies to authenticated;
grant insert (name, type, core_start, core_end, work_start, grace_minutes) on public.policies to authenticated;
grant update (name, type, core_start, core_end, work_start, grace_minutes) on public.policies to authenticated;

create policy "policies: 직원이면 조회" on public.policies
  for select to authenticated using (public.current_profile_id() is not null);
create policy "policies: 인사담당자만 생성" on public.policies
  for insert to authenticated with check (public.is_hr_admin());
create policy "policies: 인사담당자만 수정" on public.policies
  for update to authenticated using (public.is_hr_admin()) with check (public.is_hr_admin());
create policy "policies: 인사담당자만 삭제 (기본 정책 제외)" on public.policies
  for delete to authenticated using (public.is_hr_admin() and not is_default);

-- 출퇴근 기록: 조회만 직접. 쓰기는 clock_in / clock_out
alter table public.attendance_records enable row level security;
grant select on public.attendance_records to authenticated;

create policy "attendance_records: 본인·팀장·인사담당자 조회" on public.attendance_records
  for select to authenticated using (public.can_view_attendance(user_id));

-- 휴가 신청: 조회만 직접. 쓰기는 request_leave / cancel_leave / decide_leave
alter table public.leave_requests enable row level security;
grant select on public.leave_requests to authenticated;

create policy "leave_requests: 본인·팀장·인사담당자 조회" on public.leave_requests
  for select to authenticated using (public.can_view_attendance(user_id));

-- ───────────────────────── 정책 RPC ─────────────────────────

create or replace function public.set_default_policy(p_policy_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_login();
  if not public.is_hr_admin() then
    raise exception '인사담당자만 기본 정책을 정할 수 있습니다.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.policies where id = p_policy_id) then
    raise exception '정책을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  update public.policies set is_default = false where is_default and id <> p_policy_id;
  update public.policies set is_default = true where id = p_policy_id;
end;
$$;

-- 직원의 정책 배정. null이면 기본 정책을 따른다
create or replace function public.set_employee_policy(p_user_id bigint, p_policy_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_login();
  if not public.is_hr_admin() then
    raise exception '인사담당자만 정책을 배정할 수 있습니다.' using errcode = '42501';
  end if;
  if p_policy_id is not null and not exists (select 1 from public.policies where id = p_policy_id) then
    raise exception '정책을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  update public.profiles set policy_id = p_policy_id where id = p_user_id;
  if not found then
    raise exception '직원을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
end;
$$;

revoke execute on function public.set_default_policy(bigint) from public, anon;
revoke execute on function public.set_employee_policy(bigint, bigint) from public, anon;

-- ───────────────────────── 출퇴근 RPC ─────────────────────────
-- 시각과 날짜는 서버(now(), KST)가 정한다. 하루에 출근 한 번, 퇴근 한 번.
-- 퇴근은 그날(KST)의 기록에만 한다. 자정을 넘기면 전날 기록에 퇴근할 수 없다 (야간 근무는 범위 밖)

create or replace function public.clock_in()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_record public.attendance_records;
begin
  insert into public.attendance_records (user_id, date, clock_in_at)
  values (v_me, public.today_kst(), now())
  on conflict (user_id, date) do nothing
  returning * into v_record;
  if v_record.id is null then
    raise exception '오늘은 이미 출근했습니다.';
  end if;
  return public.attendance_record_json(v_record);
end;
$$;

create or replace function public.clock_out()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_record public.attendance_records;
begin
  update public.attendance_records
  set clock_out_at = now()
  where user_id = v_me and date = public.today_kst() and clock_out_at is null
  returning * into v_record;
  if v_record.id is null then
    if exists (select 1 from public.attendance_records where user_id = v_me and date = public.today_kst()) then
      raise exception '오늘은 이미 퇴근했습니다.';
    end if;
    raise exception '오늘 출근 기록이 없습니다.';
  end if;
  return public.attendance_record_json(v_record);
end;
$$;

revoke execute on function public.clock_in() from public, anon;
revoke execute on function public.clock_out() from public, anon;

-- ───────────────────────── 휴가 RPC ─────────────────────────
-- 하루 단위, 내일부터. 주말은 신청하지 않는다 (엔진이 주말을 판정하지 않음)

create or replace function public.request_leave(p_date date, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_request public.leave_requests;
begin
  if p_date is null or p_date <= public.today_kst() then
    raise exception '휴가는 내일부터 신청할 수 있습니다.';
  end if;
  if extract(isodow from p_date) in (6, 7) then
    raise exception '주말에는 휴가를 신청할 수 없습니다.';
  end if;
  if exists (
    select 1 from public.leave_requests
    where user_id = v_me and date = p_date and status in ('PENDING', 'APPROVED')
  ) then
    raise exception '이미 휴가를 신청한 날짜입니다.';
  end if;

  insert into public.leave_requests (user_id, date, reason)
  values (v_me, p_date, nullif(trim(p_reason), ''))
  returning * into v_request;
  return public.leave_request_json(v_request);
exception
  -- 같은 날짜를 동시에 신청한 경우 (위 확인을 둘 다 통과)
  when unique_violation then
    raise exception '이미 휴가를 신청한 날짜입니다.';
end;
$$;

-- 대기 중인 본인 신청만 취소(삭제)한다. 승인·반려된 신청은 기록으로 남는다
create or replace function public.cancel_leave(p_request_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_status text;
begin
  delete from public.leave_requests
  where id = p_request_id and user_id = v_me and status = 'PENDING';
  if found then
    return;
  end if;

  select status into v_status from public.leave_requests where id = p_request_id and user_id = v_me;
  if v_status is null then
    raise exception '휴가 신청을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  raise exception '이미 처리된 신청은 취소할 수 없습니다.';
end;
$$;

-- 승인·반려: 신청자 팀의 팀장 또는 인사담당자. 본인 신청은 결정할 수 없다.
-- 먼저 처리한 결정이 적용된다. 같은 행을 동시에 update하면 뒤의 요청은 앞의 커밋을 기다렸다가
-- status = 'PENDING' 조건을 다시 확인하므로 0건이 된다 (READ COMMITTED)
create or replace function public.decide_leave(p_request_id bigint, p_approve boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_user_id bigint;
  v_request public.leave_requests;
begin
  select user_id into v_user_id from public.leave_requests where id = p_request_id;
  if v_user_id is null or not public.can_view_attendance(v_user_id) then
    raise exception '휴가 신청을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  if v_user_id = v_me or not (public.is_hr_admin() or public.is_team_leader_of(v_user_id)) then
    raise exception '팀장 또는 인사담당자만 승인할 수 있습니다.' using errcode = '42501';
  end if;

  update public.leave_requests
  set status = case when p_approve then 'APPROVED' else 'REJECTED' end,
      decided_by = v_me,
      decided_at = now()
  where id = p_request_id and status = 'PENDING'
  returning * into v_request;
  if v_request.id is null then
    if exists (select 1 from public.leave_requests where id = p_request_id) then
      raise exception '이미 처리된 신청입니다.';
    end if;
    -- 결정하는 사이에 신청자가 취소했다
    raise exception '휴가 신청을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  return public.leave_request_json(v_request);
end;
$$;

revoke execute on function public.request_leave(date, text) from public, anon;
revoke execute on function public.cancel_leave(bigint) from public, anon;
revoke execute on function public.decide_leave(bigint, boolean) from public, anon;

-- ───────────────────────── 엔진 입력 ─────────────────────────

-- 한 사람의 [from, to] 기록을 엔진 입력(DayRecord[])과 적용 정책으로 돌려준다.
-- 승인된 휴가만 kind = 'LEAVE'로 넣는다. 대기·반려는 엔진 입장에서 기록이 없는 것과 같다.
-- today도 함께 준다 (엔진은 현재 날짜를 스스로 알지 않는다. 기준은 서버의 KST 날짜)
create or replace function public.attendance_range_json(p_user_id bigint, p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'userId', p_user_id,
    'policy', public.policy_json(public.effective_policy(p_user_id)),
    'records', coalesce((
      select jsonb_agg(r.record order by r.date)
      from (
        select a.date, public.attendance_record_json(a) || jsonb_build_object('kind', 'WORK') as record
        from public.attendance_records a
        where a.user_id = p_user_id and a.date between p_from and p_to
        union all
        select l.date, jsonb_build_object('date', l.date, 'kind', 'LEAVE', 'clockInAt', null, 'clockOutAt', null)
        from public.leave_requests l
        where l.user_id = p_user_id and l.status = 'APPROVED' and l.date between p_from and p_to
      ) r
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.attendance_range_json(bigint, date, date) from public, anon, authenticated;

create or replace function public.check_attendance_range(p_from date, p_to date)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_from > p_to then
    raise exception '조회 기간이 올바르지 않습니다.';
  end if;
  if p_to - p_from > 92 then
    raise exception '한 번에 93일까지 조회할 수 있습니다.';
  end if;
end;
$$;

revoke execute on function public.check_attendance_range(date, date) from public, anon, authenticated;

-- p_user_id를 비우면 본인
create or replace function public.attendance_range(p_from date, p_to date, p_user_id bigint default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_user_id bigint := coalesce(p_user_id, v_me);
begin
  perform public.check_attendance_range(p_from, p_to);
  if not public.can_view_attendance(v_user_id) or not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception '직원을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  return public.attendance_range_json(v_user_id, p_from, p_to)
    || jsonb_build_object('today', public.today_kst());
end;
$$;

-- 팀 전체. 팀장(그 팀의 ADMIN) 또는 인사담당자. 퇴사자는 빼고, 팀 멤버 목록과 같은 순서로
create or replace function public.team_attendance_range(p_group_id bigint, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_login();
  perform public.check_attendance_range(p_from, p_to);
  if not public.is_member(p_group_id) then
    raise exception '그룹을 찾을 수 없습니다.' using errcode = 'PT404';
  end if;
  if not (public.is_hr_admin() or public.is_admin(p_group_id)) then
    raise exception '팀장 또는 인사담당자만 볼 수 있습니다.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'today', public.today_kst(),
    'members', (
      select coalesce(jsonb_agg(
               public.attendance_range_json(m.user_id, p_from, p_to)
                 || jsonb_build_object('userName', p.nickname, 'role', m.role)
               order by m.created_at), '[]'::jsonb)
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      where m.group_id = p_group_id and p.is_active
    )
  );
end;
$$;

revoke execute on function public.attendance_range(date, date, bigint) from public, anon;
revoke execute on function public.team_attendance_range(bigint, date, date) from public, anon;

-- ───────────────────────── 퇴사자 ─────────────────────────
-- 퇴사자는 current_profile_id()가 null이라 출퇴근·휴가 RPC를 호출할 수 없다 (ADR-006).
-- 대기 중인 휴가는 남겨 둔다. 승인 화면(H4)에서 퇴사자의 신청은 걸러서 보여준다.
