-- 팀 채널(team:{groupId})에서 presence뿐 아니라 broadcast도 팀 멤버에게 허용한다.
--
-- Realtime 설정에서 "Allow public access"를 끄면 비공개 채널에 접속할 때 broadcast 읽기 권한도 검사한다.
-- presence만 허용하면 멤버도 "You do not have permissions to read from this Channel topic"으로 거부된다.
-- 범위는 그대로 "그 팀 멤버만"이다. 나중에 팀 채팅의 입력 중 표시 같은 일시적 신호에도 쓸 수 있다.

drop policy "team 채널: 멤버만 구독" on realtime.messages;
drop policy "team 채널: 멤버만 상태 전송" on realtime.messages;

create policy "team 채널: 멤버만 구독" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension in ('presence', 'broadcast')
    and public.can_access_team_channel((select realtime.topic()))
  );

create policy "team 채널: 멤버만 전송" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension in ('presence', 'broadcast')
    and public.can_access_team_channel((select realtime.topic()))
  );
