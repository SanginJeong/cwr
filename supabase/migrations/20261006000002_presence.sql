-- 접속 상태 (활동 중 / 자리 비움 / 오프라인)
--
-- 실제 접속 여부는 Supabase Realtime Presence가 알려준다. DB에는 사용자가 고른 상태만 저장한다.
--   online : 접속해 있으면 "활동 중" (10분 동안 입력이 없으면 클라이언트가 "자리 비움"으로 보낸다)
--   away   : 접속해 있으면 "자리 비움"
--   offline: 접속해 있어도 다른 사람에게 "오프라인"으로 보인다 (디스코드의 오프라인 표시)
-- 접속하지 않은 사람은 고른 상태와 상관없이 오프라인이다.

alter table public.profiles
  add column presence_status text not null default 'online'
  check (presence_status in ('online', 'away', 'offline'));

-- 본인 것만 바꿀 수 있다 (profiles의 "본인만 수정" 정책)
grant update (presence_status) on public.profiles to authenticated;

-- get_me에 presenceStatus 추가 (다른 기기에서 고른 상태를 이어받는다)
create or replace function public.get_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me public.profiles;
begin
  select * into v_me from public.profiles where id = public.require_login();
  return jsonb_build_object(
    'id', v_me.id,
    'email', v_me.email,
    'nickname', v_me.nickname,
    'image', v_me.image,
    'presenceStatus', v_me.presence_status,
    'createdAt', v_me.created_at,
    'updatedAt', v_me.updated_at,
    'memberships', (
      select coalesce(jsonb_agg(public.member_json(m, v_me) || jsonb_build_object('group', public.group_json(g))
                                order by m.created_at), '[]'::jsonb)
      from public.memberships m join public.groups g on g.id = m.group_id
      where m.user_id = v_me.id
    )
  );
end;
$$;

-- ───────────────────────── Realtime 채널 권한 ─────────────────────────
-- 팀마다 비공개 채널 "team:{groupId}"를 쓴다. 그 팀 멤버만 구독(select)하고 상태를 보낼(insert) 수 있다.
-- 클라이언트는 channel(..., { config: { private: true } })로 접속해야 이 정책이 적용된다.

create or replace function public.can_access_team_channel(p_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- 형식이 맞을 때만 숫자로 바꾼다 (잘못된 topic으로 캐스팅 에러가 나지 않게)
  if p_topic is null or p_topic !~ '^team:[0-9]{1,18}$' then
    return false;
  end if;
  return public.is_member(substring(p_topic from 6)::bigint);
end;
$$;

revoke execute on function public.can_access_team_channel(text) from public, anon;

create policy "team 채널: 멤버만 구독" on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'presence' and public.can_access_team_channel((select realtime.topic())));

create policy "team 채널: 멤버만 상태 전송" on realtime.messages
  for insert to authenticated
  with check (realtime.messages.extension = 'presence' and public.can_access_team_channel((select realtime.topic())));
