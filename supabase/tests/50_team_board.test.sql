-- 팀 게시판 (ADR-005)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  admin bigint := public.test_signup('tb-admin@test.com', '팀장');
  member bigint := public.test_signup('tb-member@test.com', '팀원');
  other bigint := public.test_signup('tb-other@test.com', '다른팀원');
  outsider bigint := public.test_signup('tb-out@test.com', '외부인');
  g bigint;
  token text;
  admin_post bigint;
  member_post bigint;
  member_comment bigint;
  v record;
begin
  perform public.test_login(admin);
  g := (public.create_group('개발팀') ->> 'id')::bigint;
  token := public.create_invitation(g);
  perform public.test_login(member);
  perform public.accept_invitation(token);
  perform public.test_login(other);
  perform public.accept_invitation(token);

  -- ── 작성 ──
  perform public.test_login(admin);
  insert into public.team_posts (group_id, title, content) values (g, '공지 후보', '내용') returning id into admin_post;
  perform public.test_login(member);
  insert into public.team_posts (group_id, title, content) values (g, '회의록', '내용') returning id into member_post;
  perform pg_temp.check('작성자는 본인으로 자동 설정', (select writer_id from public.team_posts where id = member_post) = member);
  perform pg_temp.check('남의 이름으로 작성 불가', public.test_error(format(
    'insert into public.team_posts (group_id, writer_id, title, content) values (%s, %s, %L, %L)', g, admin, 'x', 'x')) = '42501');
  perform pg_temp.check('작성할 때 공지로 지정 불가 (is_notice 컬럼 권한 없음)', public.test_error(format(
    'insert into public.team_posts (group_id, title, content, is_notice) values (%s, %L, %L, true)', g, 'x', 'x')) = '42501');
  insert into public.team_post_comments (post_id, content) values (member_post, '팀원 댓글') returning id into member_comment;

  -- ── 외부인 ──
  perform public.test_login(outsider);
  perform pg_temp.check('외부인: 글이 안 보임', not exists (select 1 from public.team_post_view));
  perform pg_temp.check('외부인: 댓글이 안 보임', not exists (select 1 from public.team_post_comment_view));
  perform pg_temp.check('외부인: 작성 불가', public.test_error(format(
    'insert into public.team_posts (group_id, title, content) values (%s, %L, %L)', g, 'x', 'x')) = '42501');
  perform pg_temp.check('외부인: 댓글 작성 불가', public.test_error(format(
    'insert into public.team_post_comments (post_id, content) values (%s, %L)', member_post, 'x')) = '42501');
  perform pg_temp.check('외부인: 공지 지정 불가 (404)', public.test_error(format(
    'select public.set_team_post_notice(%s, true)', admin_post)) = 'P0002');

  -- ── 비로그인 ──
  perform public.test_login(null);
  perform pg_temp.check('비로그인: 조회 불가', public.test_error('select * from public.team_post_view') = '42501');

  -- ── 다른 멤버 ──
  perform public.test_login(other);
  select * into v from public.team_post_view where id = member_post;
  perform pg_temp.check('멤버: 글 조회 + 작성자 닉네임 + 댓글 수',
    v.writer_nickname = '팀원' and v.comment_count = 1 and not v.is_notice);
  perform pg_temp.check('멤버: 남의 글 수정 불가', public.test_row_count(format(
    'update public.team_posts set title = %L where id = %s', 'hack', member_post)) = 0);
  perform pg_temp.check('멤버: 남의 글 삭제 불가', public.test_row_count(format(
    'delete from public.team_posts where id = %s', member_post)) = 0);
  perform pg_temp.check('멤버: 남의 댓글 삭제 불가', public.test_row_count(format(
    'delete from public.team_post_comments where id = %s', member_comment)) = 0);
  perform pg_temp.check('멤버: 공지 지정 불가 (403)', public.test_error(format(
    'select public.set_team_post_notice(%s, true)', member_post)) = '42501');
  perform pg_temp.check('멤버: is_notice 직접 수정 불가', public.test_error(format(
    'update public.team_posts set is_notice = true where id = %s', member_post)) = '42501');

  -- ── 작성자 ──
  perform public.test_login(member);
  perform pg_temp.check('작성자: 내 글 수정 가능', public.test_row_count(format(
    'update public.team_posts set title = %L where id = %s', '회의록(수정)', member_post)) = 1);

  -- ── ADMIN ──
  perform public.test_login(admin);
  perform public.set_team_post_notice(admin_post, true);
  perform pg_temp.check('ADMIN: 공지 지정 → 목록 맨 위',
    (select id from public.team_post_view where group_id = g order by is_notice desc, created_at desc limit 1) = admin_post);
  perform pg_temp.check('ADMIN: 남의 글 수정은 불가 (수정은 작성자만)', public.test_row_count(format(
    'update public.team_posts set title = %L where id = %s', 'hack', member_post)) = 0);
  perform pg_temp.check('ADMIN: 남의 댓글 삭제 가능', public.test_row_count(format(
    'delete from public.team_post_comments where id = %s', member_comment)) = 1);

  -- ── 탈퇴 (ADR-005 §4) ──
  perform public.test_login(member);
  perform public.delete_account();
  perform public.test_login(admin);
  select * into v from public.team_post_view where id = member_post;
  perform pg_temp.check('작성자가 탈퇴해도 글은 남고 작성자만 비워짐', v.id = member_post and v.writer_id is null and v.writer_nickname is null);
  perform pg_temp.check('ADMIN: 탈퇴한 사람의 글 삭제 가능', public.test_row_count(format(
    'delete from public.team_posts where id = %s', member_post)) = 1);

  -- ── 팀 삭제 ──
  delete from public.groups where id = g;
  perform public.test_logout();
  perform pg_temp.check('팀을 삭제하면 글도 삭제', not exists (select 1 from public.team_posts where group_id = g));

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
