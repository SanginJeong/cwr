-- 입사일 (ADR-007 보완, roadmap H3 QA)
--
-- 판정은 입사일부터 한다. 입사 전 평일이 "결근"으로 세어지던 문제 (오늘 등록한 직원의 이번 달 1일~어제).
-- 기존 계정은 계정을 만든 날(KST)로 채운다. 새 계정은 등록한 날이 기본값이고, 인사담당자가 바꿀 수 있게 할 예정 (H5)

alter table public.profiles add column hired_on date;
update public.profiles set hired_on = (created_at at time zone 'Asia/Seoul')::date;
alter table public.profiles
  alter column hired_on set not null,
  alter column hired_on set default public.today_kst();

-- attendance_range / team_attendance_range 응답에 hiredOn 추가
create or replace function public.attendance_range_json(p_user_id bigint, p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'userId', p_user_id,
    'hiredOn', (select hired_on from public.profiles where id = p_user_id),
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
