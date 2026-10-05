-- 가입하면 profiles 행을 만들고, 로그인한 사용자를 profile id로 바꿔주는 함수들

create or replace function public.current_profile_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles where auth_id = auth.uid();
$$;

-- 이메일 가입: 닉네임이 겹치면 가입 자체를 실패시킨다 (behavior-spec §5)
-- 카카오 등 OAuth: 닉네임을 사용자가 고른 게 아니라서, 겹치면 뒤에 숫자를 붙인다
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
  v_base text := left(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  ), 24);
  v_nickname text := v_base;
begin
  if exists (select 1 from public.profiles where nickname = v_nickname) then
    if v_provider = 'email' then
      raise exception '이미 사용중인 닉네임입니다.' using errcode = '23505';
    end if;
    loop
      v_nickname := v_base || '_' || floor(random() * 100000)::int;
      exit when not exists (select 1 from public.profiles where nickname = v_nickname);
    end loop;
  end if;

  insert into public.profiles (auth_id, email, nickname, image)
  values (new.id, coalesce(new.email, ''), v_nickname, new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 가입 폼에서 미리 확인용. 가입 전이라 anon도 호출할 수 있다
create or replace function public.is_nickname_available(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where nickname = trim(p_nickname));
$$;

-- 회원 탈퇴. auth.users를 지우면 profiles → 게시글, 댓글, 멤버십이 cascade로 지워진다 (behavior-spec §5)
-- 그룹이 주인 없이 남지 않도록 먼저 정리한다.
--   혼자 있는 그룹: 삭제
--   다른 멤버가 있는데 내가 유일한 ADMIN: 가장 먼저 들어온 멤버를 ADMIN으로
--   (팀 나가기와 달리 탈퇴는 막을 수 없어서 자동 위임한다. ADR-004 §4)
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.current_profile_id();
begin
  if v_me is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  delete from public.groups g
  where exists (select 1 from public.memberships m where m.group_id = g.id and m.user_id = v_me)
    and not exists (select 1 from public.memberships m where m.group_id = g.id and m.user_id <> v_me);

  update public.memberships m
  set role = 'ADMIN'
  where (m.group_id, m.user_id) in (
    select distinct on (o.group_id) o.group_id, o.user_id
    from public.memberships mine
    join public.memberships o on o.group_id = mine.group_id and o.user_id <> v_me
    where mine.user_id = v_me
      and mine.role = 'ADMIN'
      and not exists (
        select 1 from public.memberships a
        where a.group_id = mine.group_id and a.role = 'ADMIN' and a.user_id <> v_me
      )
    order by o.group_id, o.created_at, o.user_id
  );

  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.delete_account() from public, anon;
