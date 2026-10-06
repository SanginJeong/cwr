-- 접속 상태: 고른 상태 저장, 팀 채널 권한 (20261006000002_presence)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

-- topic을 정하고 그 채널을 "구독할 수 있는지"(select 정책)
create function pg_temp.can_read(p_topic text) returns boolean language plpgsql as $$
begin
  perform set_config('realtime.topic', coalesce(p_topic, ''), false);
  return exists (select 1 from realtime.messages where extension = 'presence');
end $$;

-- topic을 정하고 그 채널에 "상태를 보낼 수 있는지"(insert 정책)
create function pg_temp.can_track(p_topic text) returns boolean language plpgsql as $$
begin
  perform set_config('realtime.topic', coalesce(p_topic, ''), false);
  return public.test_error($q$insert into realtime.messages (extension, payload) values ('presence', '{}')$q$) is null;
end $$;

do $$
declare
  admin bigint := public.test_signup('pr-admin@test.com', '팀장');
  member bigint := public.test_signup('pr-member@test.com', '팀원');
  outsider bigint := public.test_signup('pr-out@test.com', '외부인');
  g bigint;
  other_g bigint;
begin
  g := public.test_create_team('개발팀', admin);
  perform public.test_add_member(g, member);
  other_g := public.test_create_team('다른팀', member);

  -- 채널에 메시지가 하나 있어야 select 정책을 확인할 수 있다 (실제로는 Realtime 서버가 넣는다)
  perform public.test_logout();
  perform set_config('realtime.topic', 'team:' || g, false);
  insert into realtime.messages (extension, payload) values ('presence', '{}'), ('broadcast', '{}');
  perform set_config('realtime.topic', 'team:' || other_g, false);
  insert into realtime.messages (extension, payload) values ('presence', '{}');

  -- ── 고른 상태 ──
  perform public.test_login(member);
  perform pg_temp.check('기본 상태는 online', public.get_me() ->> 'presenceStatus' = 'online');
  update public.profiles set presence_status = 'away' where id = member;
  perform pg_temp.check('본인 상태 변경 → get_me에 반영', public.get_me() ->> 'presenceStatus' = 'away');
  perform pg_temp.check('정해진 값만 허용', public.test_error(format(
    'update public.profiles set presence_status = %L where id = %s', 'busy', member)) = '23514');
  perform pg_temp.check('남의 상태는 바꿀 수 없음', public.test_row_count(format(
    'update public.profiles set presence_status = %L where id = %s', 'offline', admin)) = 0);

  -- ── 팀 채널 ──
  perform pg_temp.check('멤버: 자기 팀 채널 구독 가능', pg_temp.can_read('team:' || g));
  perform pg_temp.check('멤버: 자기 팀 채널에 상태 전송 가능', pg_temp.can_track('team:' || g));
  perform pg_temp.check('멤버: 팀장인 다른 팀 채널도 가능', pg_temp.can_read('team:' || other_g));
  perform pg_temp.check('멤버: broadcast 구독 가능 (Allow public access를 끄면 접속 시 검사됨)', exists (
    select 1 from realtime.messages where extension = 'broadcast' and topic = 'team:' || g));

  perform public.test_login(admin);
  perform pg_temp.check('다른 팀 채널은 구독 불가', not pg_temp.can_read('team:' || other_g));
  perform pg_temp.check('다른 팀 채널에는 상태 전송 불가', not pg_temp.can_track('team:' || other_g));

  perform public.test_login(outsider);
  perform pg_temp.check('외부인: 구독 불가', not pg_temp.can_read('team:' || g));
  perform pg_temp.check('외부인: 상태 전송 불가', not pg_temp.can_track('team:' || g));
  perform pg_temp.check('외부인: broadcast도 구독 불가', not exists (
    select 1 from realtime.messages where extension = 'broadcast' and topic = 'team:' || g));
  perform pg_temp.check('형식이 다른 topic은 거부 (캐스팅 에러 없이)',
    not pg_temp.can_read('team:abc') and not pg_temp.can_read('global') and not pg_temp.can_track('team:1;drop'));

  perform public.test_login(null);
  perform pg_temp.check('비로그인: 구독 불가', public.test_error('select * from realtime.messages') = '42501');

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 12 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
