-- 승인된 휴가 날에는 출근할 수 없다 (ADR-007)
--
-- 예전에는 휴가가 승인된 날에도 출근하기가 열려 있고 DB도 막지 않았다.
-- 대기 중인 신청은 아직 휴가가 아니므로 막지 않는다.

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
  if exists (
    select 1 from public.leave_requests
    where user_id = v_me and date = public.today_kst() and status = 'APPROVED'
  ) then
    raise exception '오늘은 휴가라 출근할 수 없습니다.';
  end if;

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
