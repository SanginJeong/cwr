-- 초대, 탈퇴, 가입, 회원 탈퇴 (behavior-spec §4.2~§5, ADR-004 §4~§5)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  admin bigint := public.test_signup('admin@test.com', '팀장');
  a bigint := public.test_signup('a@test.com', '에이');
  b bigint := public.test_signup('b@test.com', '비');
  kakao bigint;
  g bigint;
  solo bigint;
  token text;
  json jsonb;
begin
  -- ── 가입 ──
  perform pg_temp.check('이메일 가입: 닉네임 중복이면 실패',
    public.test_error($q$select public.test_signup('dup@test.com', '에이')$q$) = '23505');
  kakao := public.test_signup('k@test.com', '에이', 'kakao');
  perform pg_temp.check('카카오 가입: 닉네임이 겹치면 뒤에 숫자를 붙여서 가입',
    (select nickname from public.profiles where id = kakao) like '에이\_%');
  perform public.test_login(null);
  perform pg_temp.check('비로그인도 닉네임 중복 확인 가능',
    public.is_nickname_available('새이름') and not public.is_nickname_available('에이'));

  -- ── 그룹 생성 ──
  perform public.test_login(admin);
  json := public.create_group('개발팀');
  g := (json ->> 'id')::bigint;
  perform pg_temp.check('그룹을 만든 사람은 ADMIN',
    (select role from public.memberships where group_id = g and user_id = admin) = 'ADMIN');
  perform pg_temp.check('같은 이름의 그룹도 만들 수 있음 (기존 API와 같음)',
    public.test_error($q$select public.create_group('개발팀')$q$) is null);

  -- ── 초대 ──
  token := public.create_invitation(g);
  perform pg_temp.check('유효한 토큰이 있으면 같은 토큰을 다시 준다', public.create_invitation(g) = token);

  perform public.test_login(a);
  -- 함수 호출과 결과 확인을 한 문장에 쓰면 같은 스냅샷이라 변경이 안 보인다. 나눠서 확인한다
  json := public.accept_invitation(token);
  perform pg_temp.check('초대 수락: 응답에 groupId', json ->> 'groupId' = g::text);
  perform pg_temp.check('초대 수락: 로그인한 본인이 MEMBER로',
    (select role from public.memberships where group_id = g and user_id = a) = 'MEMBER');
  perform pg_temp.check('초대 수락: 이미 멤버면 거부', public.test_error(format('select public.accept_invitation(%L)', token)) = 'P0001');
  perform pg_temp.check('초대 수락: 없는 토큰은 거부', public.test_error($q$select public.accept_invitation('nope')$q$) = 'P0001');

  perform public.test_login(b);
  perform public.accept_invitation(token);
  perform pg_temp.check('같은 토큰을 여러 명이 쓸 수 있음', public.is_member(g));

  perform public.test_logout();
  update public.invitations set expires_at = now() - interval '1 minute' where group_id = g;
  perform public.test_login(kakao);
  perform pg_temp.check('만료된 토큰은 거부', public.test_error(format('select public.accept_invitation(%L)', token)) = 'P0001');

  -- ── get_group / get_me 응답 ──
  perform public.test_login(a);
  json := public.get_group(g);
  perform pg_temp.check('get_group: 멤버 목록에 이메일 포함 (같은 그룹 멤버끼리)',
    jsonb_array_length(json -> 'members') = 3
    and json -> 'members' -> 0 ?& array['userId', 'groupId', 'userName', 'userEmail', 'userImage', 'role']);
  json := public.get_me();
  perform pg_temp.check('get_me: memberships[].group 포함',
    json ->> 'email' = 'a@test.com' and json -> 'memberships' -> 0 -> 'group' ->> 'name' = '개발팀');

  -- ── 그룹 탈퇴 ──
  perform pg_temp.check('멤버는 탈퇴 가능', public.test_error(format('select public.leave_group(%s)', g)) is null);
  perform pg_temp.check('탈퇴하면 멤버가 아님', not public.is_member(g));
  perform public.test_login(admin);
  perform pg_temp.check('유일한 ADMIN은 다른 멤버가 있으면 탈퇴 불가 (기존 API는 가능)',
    public.test_error(format('select public.leave_group(%s)', g)) = 'P0001');
  solo := (public.create_group('혼자') ->> 'id')::bigint;
  perform pg_temp.check('유일한 멤버는 탈퇴 불가 (기존 API와 같음)',
    public.test_error(format('select public.leave_group(%s)', solo)) = 'P0001');

  -- ── 회원 탈퇴 ──
  perform public.test_login(b);
  insert into public.articles (title, content) values ('비의 글', '내용');
  perform public.test_login(admin);
  insert into public.article_comments (article_id, content)
  select id, '팀장 댓글' from public.articles where title = '비의 글';

  perform public.test_login(b);
  perform public.delete_account();
  perform public.test_logout();
  perform pg_temp.check('회원 탈퇴: 프로필 삭제', not exists (select 1 from public.profiles where id = b));
  perform pg_temp.check('회원 탈퇴: 게시글과 거기 달린 남의 댓글도 삭제 (기존 API와 같음)',
    not exists (select 1 from public.articles where title = '비의 글')
    and not exists (select 1 from public.article_comments where content = '팀장 댓글'));
  perform pg_temp.check('회원 탈퇴: 멤버십 삭제', not exists (select 1 from public.memberships where user_id = b));

  perform public.test_login(admin);
  perform public.delete_account();
  perform public.test_logout();
  perform pg_temp.check('회원 탈퇴: 혼자 있던 그룹은 삭제',
    not exists (select 1 from public.groups where id = solo)
    -- g도 a는 나가고 b는 탈퇴해서 팀장 혼자 남아 있었다
    and not exists (select 1 from public.groups where id = g));
end $$;

-- ADMIN이 탈퇴하면 남은 멤버 중 가장 먼저 들어온 사람이 ADMIN이 된다
do $$
declare
  admin bigint := public.test_signup('x-admin@test.com', '엑스팀장');
  first bigint := public.test_signup('x-first@test.com', '첫번째');
  second bigint := public.test_signup('x-second@test.com', '두번째');
  g bigint;
  token text;
begin
  perform public.test_login(admin);
  g := (public.create_group('엑스팀') ->> 'id')::bigint;
  token := public.create_invitation(g);
  perform public.test_login(first);
  perform public.accept_invitation(token);
  perform public.test_logout();
  update public.memberships set created_at = now() - interval '1 day' where user_id = first;
  perform public.test_login(second);
  perform public.accept_invitation(token);

  perform public.test_login(admin);
  perform public.delete_account();
  perform public.test_logout();
  perform pg_temp.check('회원 탈퇴: 다른 멤버가 남은 그룹은 유지', exists (select 1 from public.groups where id = g));
  perform pg_temp.check('회원 탈퇴: 유일한 ADMIN이면 가장 먼저 들어온 멤버에게 ADMIN',
    (select role from public.memberships where group_id = g and user_id = first) = 'ADMIN'
    and (select role from public.memberships where group_id = g and user_id = second) = 'MEMBER');
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 20 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
