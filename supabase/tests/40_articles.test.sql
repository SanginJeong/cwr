-- 게시판과 이미지 Storage (behavior-spec §6)

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  writer bigint := public.test_signup('w@test.com', '작성자');
  reader bigint := public.test_signup('r@test.com', '독자');
  article bigint;
  v record;
begin
  perform public.test_login(writer);
  insert into public.articles (title, content) values ('제목', '본문') returning id into article;
  perform pg_temp.check('작성자는 로그인한 본인으로 자동 설정',
    (select writer_id from public.articles where id = article) = writer);
  perform pg_temp.check('남의 이름으로 작성 불가',
    public.test_error(format('insert into public.articles (writer_id, title, content) values (%s, %L, %L)',
                             reader, 'x', 'x')) = '42501');

  -- ── 좋아요 ──
  perform public.test_login(reader);
  insert into public.article_likes (article_id) values (article);
  perform pg_temp.check('좋아요 두 번은 거부', public.test_error(
    format('insert into public.article_likes (article_id) values (%s)', article)) = '23505');
  select * into v from public.article_view where id = article;
  perform pg_temp.check('article_view: likeCount, isLiked(로그인)', v.like_count = 1 and v.is_liked);
  perform pg_temp.check('article_view: 작성자 닉네임', v.writer_nickname = '작성자');

  insert into public.article_comments (article_id, content) values (article, '댓글1'), (article, '댓글2');
  perform pg_temp.check('article_view: commentCount', (select comment_count from public.article_view where id = article) = 2);
  perform pg_temp.check('남의 글 수정 불가',
    public.test_row_count(format('update public.articles set title = %L where id = %s', 'hack', article)) = 0);
  perform pg_temp.check('남의 글 삭제 불가',
    public.test_row_count(format('delete from public.articles where id = %s', article)) = 0);
  perform pg_temp.check('다른 사람 좋아요 취소 불가', public.test_row_count(
    format('delete from public.article_likes where article_id = %s and user_id <> %s', article, reader)) = 0);

  perform public.test_login(writer);
  perform pg_temp.check('article_view: 좋아요 안 한 사람은 isLiked false',
    (select is_liked from public.article_view where id = article) = false);
  perform pg_temp.check('남의 댓글 수정 불가', public.test_row_count(
    format('update public.article_comments set content = %L where article_id = %s', 'hack', article)) = 0);

  -- ── 비로그인 ──
  perform public.test_login(null);
  select * into v from public.article_view where id = article;
  perform pg_temp.check('비로그인: 글 조회 가능, isLiked는 null', v.id = article and v.is_liked is null);
  perform pg_temp.check('비로그인: 댓글 조회 가능', (select count(*) from public.article_comment_view where article_id = article) = 2);
  perform pg_temp.check('비로그인: 작성 불가',
    public.test_error($q$insert into public.articles (title, content) values ('x', 'x')$q$) = '42501');
  perform pg_temp.check('비로그인: 이메일 조회 불가', public.test_error('select email from public.profiles') = '42501');

  -- ── 이미지 Storage ──
  perform public.test_login(writer);
  perform pg_temp.check('이미지: 내 폴더에 업로드 가능', public.test_error(format(
    'insert into storage.objects (bucket_id, name) values (%L, %L)', 'images', auth.uid() || '/a.png')) is null);
  perform pg_temp.check('이미지: 남의 폴더에는 업로드 불가', public.test_error(format(
    'insert into storage.objects (bucket_id, name) values (%L, %L)', 'images', gen_random_uuid() || '/a.png')) = '42501');
  perform pg_temp.check('이미지 버킷: 10MB, 이미지 MIME만',
    (select file_size_limit = 10485760 and 'image/png' = any (allowed_mime_types) and public
     from storage.buckets where id = 'images'));

  perform public.test_logout();
end $$;

do $$
declare
  failures text := (select string_agg(name, E'\n    ') from test_results where not ok);
begin
  if failures is not null then
    raise exception E'실패한 항목:\n    %', failures;
  end if;
  if (select count(*) from test_results) < 15 then
    raise exception '검사 항목 수가 너무 적음: %', (select count(*) from test_results);
  end if;
end $$;
