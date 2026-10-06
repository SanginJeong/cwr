-- 마이그레이션이 적용되고 가입 트리거가 동작하는지
do $$
declare v_id bigint;
begin
  v_id := public.test_signup('a@test.com', '에이');
  assert v_id is not null, '가입하면 profile이 생겨야 한다';
  assert (select nickname from public.profiles where id = v_id) = '에이';
end $$;
