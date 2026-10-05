-- 권한 (ADR-004 §3). 기존 API의 권한 구멍(behavior-spec §4.1)을 따라 하지 않는다.
--
-- 원칙
--   1. Supabase는 public 테이블을 anon/authenticated에게 기본으로 열어 두므로, 먼저 전부 회수하고 필요한 것만 연다.
--   2. 여러 테이블을 함께 바꾸거나 서버가 값을 정해야 하는 쓰기(그룹 생성, task 생성·완료, 초대)는 RPC로만 한다.
--      그런 테이블에는 INSERT/UPDATE 권한 자체를 주지 않는다.

-- ───────────────────────── 헬퍼 ─────────────────────────
-- security definer: 정책 안에서 memberships를 읽을 때 memberships 자신의 RLS를 다시 타지 않게 한다

create or replace function public.is_member(p_group_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = public.current_profile_id()
  );
$$;

create or replace function public.is_admin(p_group_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where group_id = p_group_id and user_id = public.current_profile_id() and role = 'ADMIN'
  );
$$;

create or replace function public.can_access_task_list(p_task_list_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.task_lists tl
    where tl.id = p_task_list_id and public.is_member(tl.group_id)
  );
$$;

create or replace function public.can_access_task(p_task_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = p_task_id and public.can_access_task_list(t.task_list_id)
  );
$$;

-- ───────────────────────── 권한 초기화 ─────────────────────────

revoke all on all tables in schema public from anon, authenticated;

-- ───────────────────────── profiles ─────────────────────────
-- 닉네임과 이미지는 게시글 작성자 표시에 필요해서 누구나 읽는다. 이메일은 RPC(get_me, get_group)로만 준다

alter table public.profiles enable row level security;
grant select (id, nickname, image, created_at, updated_at) on public.profiles to anon, authenticated;
grant update (nickname, image) on public.profiles to authenticated;

create policy "profiles: 누구나 조회" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles: 본인만 수정" on public.profiles
  for update to authenticated using (auth_id = auth.uid()) with check (auth_id = auth.uid());

-- ───────────────────────── groups ─────────────────────────
-- 생성은 create_group RPC (생성자를 ADMIN으로 함께 넣어야 해서)

alter table public.groups enable row level security;
grant select, delete on public.groups to authenticated;
grant update (name, image) on public.groups to authenticated;

create policy "groups: 멤버만 조회" on public.groups
  for select to authenticated using (public.is_member(id));
create policy "groups: ADMIN만 수정" on public.groups
  for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));
create policy "groups: ADMIN만 삭제" on public.groups
  for delete to authenticated using (public.is_admin(id));

-- ───────────────────────── memberships ─────────────────────────
-- 추가는 create_group / accept_invitation, 본인 탈퇴는 leave_group RPC

alter table public.memberships enable row level security;
grant select, delete on public.memberships to authenticated;

create policy "memberships: 같은 그룹 멤버만 조회" on public.memberships
  for select to authenticated using (public.is_member(group_id));
create policy "memberships: ADMIN이 MEMBER만 강퇴" on public.memberships
  for delete to authenticated using (public.is_admin(group_id) and role = 'MEMBER');

-- ───────────────────────── invitations ─────────────────────────
-- 직접 접근 없음. create_invitation / accept_invitation RPC

alter table public.invitations enable row level security;

-- ───────────────────────── task_lists ─────────────────────────

alter table public.task_lists enable row level security;
grant select, delete on public.task_lists to authenticated;
grant insert (group_id, name) on public.task_lists to authenticated;
grant update (name, display_index) on public.task_lists to authenticated;

create policy "task_lists: 멤버만 조회" on public.task_lists
  for select to authenticated using (public.is_member(group_id));
create policy "task_lists: 멤버만 생성" on public.task_lists
  for insert to authenticated with check (public.is_member(group_id));
create policy "task_lists: 멤버만 수정" on public.task_lists
  for update to authenticated using (public.is_member(group_id)) with check (public.is_member(group_id));
create policy "task_lists: 멤버만 삭제" on public.task_lists
  for delete to authenticated using (public.is_member(group_id));

-- ───────────────────────── recurrings ─────────────────────────
-- 생성·수정은 RPC (시작일 검증, 이미 만들어진 task에 반영). 삭제는 직접 (task는 cascade)

alter table public.recurrings enable row level security;
grant select, delete on public.recurrings to authenticated;

create policy "recurrings: 멤버만 조회" on public.recurrings
  for select to authenticated using (public.is_member(group_id));
create policy "recurrings: 멤버만 삭제" on public.recurrings
  for delete to authenticated using (public.is_member(group_id));

-- ───────────────────────── tasks ─────────────────────────
-- 조회만 직접. 생성은 tasks_for_date, 수정·완료는 update_task, 삭제(soft)는 delete_task RPC

alter table public.tasks enable row level security;
grant select on public.tasks to authenticated;

create policy "tasks: 멤버만 조회" on public.tasks
  for select to authenticated using (public.can_access_task_list(task_list_id));

-- ───────────────────────── task_comments ─────────────────────────

alter table public.task_comments enable row level security;
grant select, delete on public.task_comments to authenticated;
grant insert (task_id, content) on public.task_comments to authenticated;
grant update (content) on public.task_comments to authenticated;

alter table public.task_comments alter column user_id set default public.current_profile_id();

create policy "task_comments: 멤버만 조회" on public.task_comments
  for select to authenticated using (public.can_access_task(task_id));
create policy "task_comments: 멤버만 작성" on public.task_comments
  for insert to authenticated
  with check (public.can_access_task(task_id) and user_id = public.current_profile_id());
create policy "task_comments: 작성자만 수정" on public.task_comments
  for update to authenticated
  using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "task_comments: 작성자만 삭제" on public.task_comments
  for delete to authenticated using (user_id = public.current_profile_id());

-- ───────────────────────── articles ─────────────────────────

alter table public.articles enable row level security;
grant select on public.articles to anon, authenticated;
grant delete on public.articles to authenticated;
grant insert (title, content, image) on public.articles to authenticated;
grant update (title, content, image) on public.articles to authenticated;

alter table public.articles alter column writer_id set default public.current_profile_id();

create policy "articles: 누구나 조회" on public.articles
  for select to anon, authenticated using (true);
create policy "articles: 본인 이름으로 작성" on public.articles
  for insert to authenticated with check (writer_id = public.current_profile_id());
create policy "articles: 작성자만 수정" on public.articles
  for update to authenticated
  using (writer_id = public.current_profile_id()) with check (writer_id = public.current_profile_id());
create policy "articles: 작성자만 삭제" on public.articles
  for delete to authenticated using (writer_id = public.current_profile_id());

-- ───────────────────────── article_likes ─────────────────────────

alter table public.article_likes enable row level security;
grant select on public.article_likes to anon, authenticated;
grant insert (article_id), delete on public.article_likes to authenticated;

alter table public.article_likes alter column user_id set default public.current_profile_id();

create policy "article_likes: 누구나 조회" on public.article_likes
  for select to anon, authenticated using (true);
create policy "article_likes: 본인 것만 추가" on public.article_likes
  for insert to authenticated with check (user_id = public.current_profile_id());
create policy "article_likes: 본인 것만 취소" on public.article_likes
  for delete to authenticated using (user_id = public.current_profile_id());

-- ───────────────────────── article_comments ─────────────────────────

alter table public.article_comments enable row level security;
grant select on public.article_comments to anon, authenticated;
grant delete on public.article_comments to authenticated;
grant insert (article_id, content) on public.article_comments to authenticated;
grant update (content) on public.article_comments to authenticated;

alter table public.article_comments alter column writer_id set default public.current_profile_id();

create policy "article_comments: 누구나 조회" on public.article_comments
  for select to anon, authenticated using (true);
create policy "article_comments: 본인 이름으로 작성" on public.article_comments
  for insert to authenticated with check (writer_id = public.current_profile_id());
create policy "article_comments: 작성자만 수정" on public.article_comments
  for update to authenticated
  using (writer_id = public.current_profile_id()) with check (writer_id = public.current_profile_id());
create policy "article_comments: 작성자만 삭제" on public.article_comments
  for delete to authenticated using (writer_id = public.current_profile_id());
