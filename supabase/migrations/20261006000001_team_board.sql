-- 팀 게시판 (ADR-005)
-- 자유게시판(articles)과 달리 그룹 멤버만 보고, ADMIN이 공지 고정·글 정리를 할 수 있다.

-- ───────────────────────── 테이블 ─────────────────────────

create table public.team_posts (
  id          bigint generated always as identity primary key,
  group_id    bigint not null references public.groups (id) on delete cascade,
  -- 탈퇴해도 팀의 기록은 남긴다 (ADR-005 §4)
  writer_id   bigint references public.profiles (id) on delete set null default public.current_profile_id(),
  title       text not null check (char_length(title) between 1 and 200),
  content     text not null check (char_length(content) between 1 and 10000),
  image       text,
  is_notice   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index team_posts_group_list_idx on public.team_posts (group_id, is_notice desc, created_at desc);

create table public.team_post_comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.team_posts (id) on delete cascade,
  writer_id   bigint references public.profiles (id) on delete set null default public.current_profile_id(),
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index team_post_comments_post_id_idx on public.team_post_comments (post_id, id desc);

create trigger set_updated_at before update on public.team_posts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.team_post_comments
  for each row execute function public.set_updated_at();

-- ───────────────────────── 헬퍼 ─────────────────────────

create or replace function public.team_post_group_id(p_post_id bigint)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select group_id from public.team_posts where id = p_post_id;
$$;

-- RLS 정책에서 쓰므로 authenticated는 실행할 수 있어야 한다
revoke execute on function public.team_post_group_id(bigint) from public, anon;

-- ───────────────────────── 권한 (ADR-005 §3) ─────────────────────────

revoke all on public.team_posts, public.team_post_comments from anon, authenticated;

alter table public.team_posts enable row level security;
grant select, delete on public.team_posts to authenticated;
grant insert (group_id, title, content, image) on public.team_posts to authenticated;
-- is_notice는 열지 않는다. set_team_post_notice RPC로만 (ADMIN)
grant update (title, content, image) on public.team_posts to authenticated;

create policy "team_posts: 멤버만 조회" on public.team_posts
  for select to authenticated using (public.is_member(group_id));
create policy "team_posts: 멤버가 본인 이름으로 작성" on public.team_posts
  for insert to authenticated
  with check (public.is_member(group_id) and writer_id = public.current_profile_id());
create policy "team_posts: 작성자만 수정" on public.team_posts
  for update to authenticated
  using (writer_id = public.current_profile_id() and public.is_member(group_id))
  with check (writer_id = public.current_profile_id() and public.is_member(group_id));
create policy "team_posts: 작성자 또는 ADMIN이 삭제" on public.team_posts
  for delete to authenticated
  using (public.is_member(group_id) and (writer_id = public.current_profile_id() or public.is_admin(group_id)));

alter table public.team_post_comments enable row level security;
grant select, delete on public.team_post_comments to authenticated;
grant insert (post_id, content) on public.team_post_comments to authenticated;
grant update (content) on public.team_post_comments to authenticated;

create policy "team_post_comments: 멤버만 조회" on public.team_post_comments
  for select to authenticated using (public.is_member(public.team_post_group_id(post_id)));
create policy "team_post_comments: 멤버가 본인 이름으로 작성" on public.team_post_comments
  for insert to authenticated
  with check (public.is_member(public.team_post_group_id(post_id)) and writer_id = public.current_profile_id());
create policy "team_post_comments: 작성자만 수정" on public.team_post_comments
  for update to authenticated
  using (writer_id = public.current_profile_id() and public.is_member(public.team_post_group_id(post_id)))
  with check (writer_id = public.current_profile_id());
create policy "team_post_comments: 작성자 또는 ADMIN이 삭제" on public.team_post_comments
  for delete to authenticated
  using (
    public.is_member(public.team_post_group_id(post_id))
    and (writer_id = public.current_profile_id() or public.is_admin(public.team_post_group_id(post_id)))
  );

-- ───────────────────────── 공지 (ADR-005 §2) ─────────────────────────

create or replace function public.set_team_post_notice(p_post_id bigint, p_is_notice boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id bigint := public.team_post_group_id(p_post_id);
begin
  perform public.require_login();
  if v_group_id is null or not public.is_member(v_group_id) then
    raise exception '게시글을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if not public.is_admin(v_group_id) then
    raise exception '관리자만 공지를 지정할 수 있습니다.' using errcode = '42501';
  end if;
  update public.team_posts set is_notice = p_is_notice where id = p_post_id;
end;
$$;

revoke execute on function public.set_team_post_notice(bigint, boolean) from public, anon;

-- ───────────────────────── 조회 뷰 ─────────────────────────
-- security_invoker: 읽는 사람의 RLS가 그대로 적용된다

create view public.team_post_view
with (security_invoker = true)
as
select
  t.id,
  t.group_id,
  t.title,
  t.content,
  t.image,
  t.is_notice,
  t.created_at,
  t.updated_at,
  t.writer_id,
  p.nickname as writer_nickname,
  p.image as writer_image,
  (select count(*) from public.team_post_comments c where c.post_id = t.id) as comment_count
from public.team_posts t
left join public.profiles p on p.id = t.writer_id;

create view public.team_post_comment_view
with (security_invoker = true)
as
select
  c.id,
  c.post_id,
  c.content,
  c.created_at,
  c.updated_at,
  c.writer_id,
  p.nickname as writer_nickname,
  p.image as writer_image
from public.team_post_comments c
left join public.profiles p on p.id = c.writer_id;

grant select on public.team_post_view, public.team_post_comment_view to authenticated;
