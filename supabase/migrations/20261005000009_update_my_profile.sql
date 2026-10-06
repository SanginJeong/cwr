-- 프로필 수정 RPC.
-- profiles를 직접 update하려면 "내 행"을 찾는 조건(auth_id)이 필요한데, auth_id는 클라이언트에 열지 않았다.
-- 닉네임 중복도 사용자용 문장으로 돌려준다.

create or replace function public.update_my_profile(p_nickname text default null, p_image text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me bigint := public.require_login();
  v_profile public.profiles;
begin
  if p_nickname is not null and exists (
    select 1 from public.profiles where nickname = trim(p_nickname) and id <> v_me
  ) then
    raise exception '이미 사용중인 닉네임입니다.';
  end if;

  update public.profiles set
    nickname = coalesce(trim(p_nickname), nickname),
    image = coalesce(p_image, image)
  where id = v_me
  returning * into v_profile;

  return jsonb_build_object('id', v_profile.id, 'nickname', v_profile.nickname, 'image', v_profile.image);
end;
$$;

revoke execute on function public.update_my_profile(text, text) from public, anon;
