-- 로그인할 때 비어 있던 이메일·이미지를 채운다 (20261005000008)
do $$
declare
  me bigint := public.test_signup('', '카카오유저', 'kakao');
  v public.profiles;
begin
  update auth.users set email = null where id = (select auth_id from public.profiles where id = me);
  update public.profiles set nickname = '내가바꾼닉네임' where id = me;

  -- 나중에 동의해서 카카오가 이메일과 사진을 준 상태로 다시 로그인
  update auth.users
  set email = 'kakao@test.com',
      raw_user_meta_data = raw_user_meta_data || '{"avatar_url": "https://img/a.png", "nickname": "카카오닉"}'
  where id = (select auth_id from public.profiles where id = me);

  select * into v from public.profiles where id = me;
  assert v.email = 'kakao@test.com', '이메일이 채워져야 한다';
  assert v.image = 'https://img/a.png', '이미지가 채워져야 한다';
  assert v.nickname = '내가바꾼닉네임', '닉네임은 덮어쓰지 않는다';

  -- 사용자가 바꾼 이미지는 덮어쓰지 않는다
  update public.profiles set image = 'https://img/mine.png' where id = me;
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"avatar_url": "https://img/b.png"}'
  where id = (select auth_id from public.profiles where id = me);
  assert (select image from public.profiles where id = me) = 'https://img/mine.png', '직접 바꾼 이미지는 유지';
end $$;

-- 프로필 수정 RPC (20261005000009)
do $$
declare
  a bigint := public.test_signup('pa@test.com', '에이');
  b bigint := public.test_signup('pb@test.com', '비');
begin
  perform public.test_login(a);
  assert public.update_my_profile(p_nickname => '새이름') ->> 'nickname' = '새이름', '닉네임 수정';
  assert public.update_my_profile(p_image => 'https://img/x.png') ->> 'nickname' = '새이름', '이미지만 바꾸면 닉네임 유지';
  assert public.test_error($q$select public.update_my_profile(p_nickname => '비')$q$) = 'P0001', '중복 닉네임은 거부';
  perform public.test_logout();
  assert (select nickname from public.profiles where id = b) = '비', '남의 프로필은 그대로';
end $$;
