-- 휴가 승인 화면과 팀 휴가 달력 (roadmap H4, ADR-007)
--
-- leave_requests는 RLS로 직접 읽을 수 있지만, 승인 화면에는 신청자 이름·소속 팀·같은 날 겹치는 팀원이 필요하고
-- 퇴사자의 신청은 빼야 한다 (팀장은 profiles.is_active를 읽을 수 없다). 그래서 RPC로 모아서 준다.

-- 내가 결정할 수 있는 신청자인지: 인사담당자, 또는 그 사람이 속한 팀의 팀장. 본인은 제외 (decide_leave와 같은 규칙)
create or replace function public.can_decide_leave_of(p_user_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id <> public.current_profile_id() and (public.is_hr_admin() or public.is_team_leader_of(p_user_id));
$$;

revoke execute on function public.can_decide_leave_of(bigint) from public, anon, authenticated;

-- 승인 목록. p_pending이면 대기 중(날짜 순), 아니면 처리됨(최근 처리 순, 100건)
-- overlaps: 신청자와 같은 팀에 있는 다른 사람의 같은 날 휴가(대기·승인)
create or replace function public.review_leave_requests(p_pending boolean default true)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_login();

  return coalesce((
    select jsonb_agg(item.json order by item.rn)
    from (
      select
        -- 대기: 휴가 날짜·신청 순 / 처리됨: 최근 처리 순
        row_number() over (
          order by
            case when p_pending then l.date end,
            case when p_pending then l.created_at end,
            case when p_pending then null else l.decided_at end desc
        ) as rn,
        jsonb_build_object(
          'id', l.id,
          'userId', l.user_id,
          'userName', p.nickname,
          'userImage', p.image,
          'date', l.date,
          'status', l.status,
          'reason', l.reason,
          'createdAt', l.created_at,
          'decidedAt', l.decided_at,
          'decidedByName', dp.nickname,
          'teams', (
            select coalesce(jsonb_agg(g.name order by g.name), '[]'::jsonb)
            from public.memberships m join public.groups g on g.id = m.group_id
            where m.user_id = l.user_id
          ),
          'overlaps', (
            select coalesce(jsonb_agg(jsonb_build_object('userName', op.nickname, 'status', o.status) order by op.nickname), '[]'::jsonb)
            from public.leave_requests o
            join public.profiles op on op.id = o.user_id
            where o.date = l.date
              and o.user_id <> l.user_id
              and o.status in ('PENDING', 'APPROVED')
              and op.is_active
              and exists (
                select 1 from public.memberships a join public.memberships b on b.group_id = a.group_id
                where a.user_id = l.user_id and b.user_id = o.user_id
              )
          )
        ) as json
      from public.leave_requests l
      join public.profiles p on p.id = l.user_id
      left join public.profiles dp on dp.id = l.decided_by
      where p.is_active
        and public.can_decide_leave_of(l.user_id)
        and (case when p_pending then l.status = 'PENDING' else l.status <> 'PENDING' end)
    ) item
    where p_pending or item.rn <= 100
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.review_leave_requests(boolean) from public, anon;

-- 팀 휴가 달력: 그 팀 (퇴사자 제외) 멤버의 대기·승인 휴가. 팀장(그 팀의 ADMIN) 또는 인사담당자
create or replace function public.team_leave_calendar(p_group_id bigint, p_from date, p_to date)
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
    'leaves', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', l.id, 'date', l.date, 'userId', l.user_id, 'userName', p.nickname, 'status', l.status)
             order by l.date, l.status, p.nickname), '[]'::jsonb)
      from public.leave_requests l
      join public.memberships m on m.user_id = l.user_id and m.group_id = p_group_id
      join public.profiles p on p.id = l.user_id
      where p.is_active
        and l.status in ('PENDING', 'APPROVED')
        and l.date between p_from and p_to
    )
  );
end;
$$;

revoke execute on function public.team_leave_calendar(bigint, date, date) from public, anon;
