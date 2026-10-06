-- 가입 트리거, 팀 생성, get_group / get_me 응답 (behavior-spec §2.7, §5, ADR-006)
-- 역할별 권한은 15_company_roles에서 확인한다.

create temp table test_results (name text, ok boolean);
grant all on test_results to anon, authenticated;

create function pg_temp.check(p_name text, p_ok boolean) returns void language sql as $$
  insert into test_results values (p_name, coalesce(p_ok, false));
$$;

do $$
declare
  hr bigint := public.test_signup('hr@test.com', '인사', p_company_role => 'HR_ADMIN');
  leader bigint := public.test_signup('leader@test.com', '팀장');
  a bigint := public.test_signup('a@test.com', '에이');
  kakao bigint;
  self_signup bigint;
  g bigint;
  json jsonb;
begin
  -- ── 계정 생성 (트리거) ──
  perform pg_temp.check('닉네임 중복이면 계정 생성 실패',
    public.test_error($q$select public.test_signup('dup@test.com', '에이')$q$) = '23505');
  kakao := public.test_signup('k@test.com', '에이', 'kakao');
  perform pg_temp.check('OAuth: 닉네임이 겹치면 뒤에 숫자를 붙여서 생성',
    (select nickname from public.profiles where id = kakao) like '에이\_%');
  perform public.test_login(null);
  perform pg_temp.check('비로그인도 닉네임 중복 확인 가능 (직원 등록 BFF가 미리 확인)',
    public.is_nickname_available('새이름') and not public.is_nickname_available('에이'));
  perform public.test_logout();

  -- 직원 등록 BFF를 거치지 않고 생긴 계정 (공개 가입을 끄지 않은 경우)
  insert into auth.users (email, raw_user_meta_data) values ('self@test.com', '{"nickname": "셀프"}');
  select id into self_signup from public.profiles where email = 'self@test.com';
  perform pg_temp.check('새 계정은 비활성·직원으로 시작',
    (select not is_active and company_role = 'EMPLOYEE' from public.profiles where id = self_signup));
  perform public.test_login(self_signup);
  perform pg_temp.check('스스로 가입한 계정은 로그인해도 아무것도 못 함',
    public.test_error('select public.get_me()') = '42501');

  -- ── 팀 생성 ──
  perform public.test_login(hr);
  json := public.create_group('개발팀');
  g := (json ->> 'id')::bigint;
  perform pg_temp.check('create_group 응답은 그룹 객체', json ->> 'name' = '개발팀' and json ? 'createdAt');
  perform pg_temp.check('팀을 만든 인사담당자는 멤버가 되지 않음',
    not exists (select 1 from public.memberships where group_id = g));
  perform pg_temp.check('같은 이름의 팀도 만들 수 있음 (기존 API와 같음)',
    public.test_error($q$select public.create_group('개발팀')$q$) is null);

  insert into public.memberships (group_id, user_id, role) values (g, leader, 'ADMIN');
  insert into public.memberships (group_id, user_id) values (g, a);

  -- ── get_group / get_me 응답 ──
  perform public.test_login(a);
  json := public.get_group(g);
  perform pg_temp.check('get_group: 멤버 목록에 이메일 포함 (같은 팀 멤버끼리)',
    jsonb_array_length(json -> 'members') = 2
    and json -> 'members' -> 0 ?& array['userId', 'groupId', 'userName', 'userEmail', 'userImage', 'role']);
  perform pg_temp.check('get_group: 배정 순서대로, 기본 역할은 MEMBER',
    json -> 'members' -> 0 ->> 'role' = 'ADMIN' and json -> 'members' -> 1 ->> 'role' = 'MEMBER');
  json := public.get_me();
  perform pg_temp.check('get_me: memberships[].group 포함',
    json ->> 'email' = 'a@test.com' and json -> 'memberships' -> 0 -> 'group' ->> 'name' = '개발팀');
  perform pg_temp.check('get_me: companyRole', json ->> 'companyRole' = 'EMPLOYEE');

  perform public.test_login(hr);
  json := public.get_me();
  perform pg_temp.check('get_me: 인사담당자', json ->> 'companyRole' = 'HR_ADMIN'
    and jsonb_array_length(json -> 'memberships') = 0);

  -- ── 없어진 기능 ──
  perform pg_temp.check('초대 RPC 없음', public.test_error('select public.create_invitation(1)') = '42883');
  perform pg_temp.check('팀 나가기 RPC 없음', public.test_error('select public.leave_group(1)') = '42883');
  perform pg_temp.check('회원 탈퇴 RPC 없음', public.test_error('select public.delete_account()') = '42883');

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
