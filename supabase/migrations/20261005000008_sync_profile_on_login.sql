-- 처음 가입할 때 카카오 선택 동의를 하지 않았다가 나중에 동의하면,
-- 로그인할 때 auth.users의 메타데이터가 갱신된다. 그때 profiles의 빈 값(이메일, 이미지)을 채운다.
-- 닉네임은 사용자가 직접 바꿨을 수 있어서 덮어쓰지 않는다.

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
  set
    email = case when coalesce(new.email, '') <> '' then new.email else p.email end,
    image = coalesce(p.image, new.raw_user_meta_data ->> 'avatar_url')
  where p.auth_id = new.id
    and (
      (coalesce(new.email, '') <> '' and p.email is distinct from new.email)
      or (p.image is null and new.raw_user_meta_data ->> 'avatar_url' is not null)
    );
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

revoke execute on function public.handle_user_updated() from public, anon, authenticated;
