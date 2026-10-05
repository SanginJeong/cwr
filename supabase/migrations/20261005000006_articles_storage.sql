-- 게시판 조회용 뷰와 이미지 Storage

-- ───────────────────────── 게시판 ─────────────────────────
-- 목록·상세에 필요한 집계(likeCount, commentCount)와 isLiked를 한 번에.
-- security_invoker: 뷰를 읽는 사람의 권한과 RLS가 그대로 적용된다

create view public.article_view
with (security_invoker = true)
as
select
  a.id,
  a.title,
  a.content,
  a.image,
  a.created_at,
  a.updated_at,
  a.writer_id,
  p.nickname as writer_nickname,
  p.image as writer_image,
  (select count(*) from public.article_likes l where l.article_id = a.id) as like_count,
  (select count(*) from public.article_comments c where c.article_id = a.id) as comment_count,
  -- 비로그인이면 null (behavior-spec §6)
  case when public.current_profile_id() is null then null
       else exists (select 1 from public.article_likes l
                    where l.article_id = a.id and l.user_id = public.current_profile_id())
  end as is_liked
from public.articles a
join public.profiles p on p.id = a.writer_id;

grant select on public.article_view to anon, authenticated;

create view public.article_comment_view
with (security_invoker = true)
as
select
  c.id,
  c.article_id,
  c.content,
  c.created_at,
  c.updated_at,
  c.writer_id,
  p.nickname as writer_nickname,
  p.image as writer_image
from public.article_comments c
join public.profiles p on p.id = c.writer_id;

grant select on public.article_comment_view to anon, authenticated;

create view public.task_comment_view
with (security_invoker = true)
as
select
  c.id,
  c.task_id,
  c.content,
  c.created_at,
  c.updated_at,
  c.user_id,
  p.nickname as user_nickname,
  p.image as user_image
from public.task_comments c
join public.profiles p on p.id = c.user_id;

grant select on public.task_comment_view to authenticated;

-- ───────────────────────── 이미지 Storage ─────────────────────────
-- 경로: images/{auth uid}/{파일}. 본인 폴더에만 올리고 지울 수 있다. 읽기는 공개 URL
-- 10MB, 이미지 MIME만 (기존 /images/upload와 같은 제한)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

create policy "images: 본인 폴더에 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images: 본인 파일 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
