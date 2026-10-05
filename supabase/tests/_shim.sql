-- 테스트 전용: Supabase가 제공하는 auth 스키마, role, 기본 권한을 흉내 낸다.
-- 실제 Supabase 프로젝트에는 적용하지 않는다 (scripts/test-db.mjs에서만 사용).

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  raw_user_meta_data  jsonb not null default '{}',
  raw_app_meta_data   jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

-- Supabase의 auth.uid()와 같은 방식: 요청 JWT의 sub
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

-- Supabase의 기본 권한: public 스키마의 새 테이블·함수는 anon/authenticated에게 열려 있다
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- 테스트 헬퍼 ------------------------------------------------------------

-- 가입: auth.users에 넣으면 트리거가 profiles를 만든다. profile id를 돌려준다
create function public.test_signup(p_email text, p_nickname text, p_provider text default 'email')
returns bigint language plpgsql as $$
declare v_auth uuid;
begin
  insert into auth.users (email, raw_user_meta_data, raw_app_meta_data)
  values (p_email, jsonb_build_object('nickname', p_nickname), jsonb_build_object('provider', p_provider))
  returning id into v_auth;
  return (select id from public.profiles where auth_id = v_auth);
end $$;

-- 해당 사용자로 로그인한 상태로 전환. null이면 비로그인(anon)
create function public.test_login(p_profile_id bigint) returns void language plpgsql as $$
declare v_auth uuid;
begin
  execute 'reset role';
  select auth_id into v_auth from public.profiles where id = p_profile_id;
  if p_profile_id is null then
    perform set_config('request.jwt.claims', '{}', false);
    execute 'set role anon';
  else
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_auth)::text, false);
    execute 'set role authenticated';
  end if;
end $$;

create function public.test_logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{}', false);
end $$;

-- SQL을 실행하고 에러 코드를 돌려준다. 에러가 없으면 null
create function public.test_error(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return null;
exception when others then
  return sqlstate;
end $$;

-- SQL을 실행하고 영향받은 행 수를 돌려준다 (RLS로 조용히 걸러지는 UPDATE/DELETE 확인용)
create function public.test_row_count(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

-- Storage (버킷과 정책만 흉내 낸다)
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid default auth.uid()
);
alter table storage.objects enable row level security;
grant select, insert, delete on storage.objects to authenticated;
grant select on storage.buckets to anon, authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1];
$$;

-- Realtime (채널 권한 정책만 흉내 낸다)
-- 실제 Supabase는 채널에 접속할 때 topic을 realtime.topic()으로 노출하고 realtime.messages의 RLS를 검사한다.
create schema realtime;
grant usage on schema realtime to anon, authenticated, service_role;
create table realtime.messages (
  id bigint generated always as identity primary key,
  topic text not null default current_setting('realtime.topic', true),
  extension text not null,
  payload jsonb
);
alter table realtime.messages enable row level security;
grant select, insert on realtime.messages to authenticated;
create function realtime.topic() returns text language sql stable as $$
  select nullif(current_setting('realtime.topic', true), '');
$$;
grant execute on function realtime.topic() to anon, authenticated;
