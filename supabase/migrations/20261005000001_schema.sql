-- Coworkers 스키마 (ADR-004)
-- id는 프론트 타입(number)과 맞추려고 bigint identity를 쓴다. Supabase Auth의 uuid는 profiles.auth_id로만 연결한다.

-- ───────────────────────── 공통 ─────────────────────────

-- 날짜 계산은 KST 기준 (behavior-spec §1)
create or replace function public.today_kst()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ───────────────────────── 사용자 ─────────────────────────

create table public.profiles (
  id          bigint generated always as identity primary key,
  auth_id     uuid not null unique references auth.users (id) on delete cascade,
  email       text not null,
  nickname    text not null unique check (char_length(nickname) between 1 and 30),
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────── 그룹 ─────────────────────────

create table public.groups (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 30),
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.memberships (
  group_id    bigint not null references public.groups (id) on delete cascade,
  user_id     bigint not null references public.profiles (id) on delete cascade,
  role        text not null default 'MEMBER' check (role in ('ADMIN', 'MEMBER')),
  created_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index memberships_user_id_idx on public.memberships (user_id);

create table public.invitations (
  token       text primary key default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  group_id    bigint not null references public.groups (id) on delete cascade,
  created_by  bigint references public.profiles (id) on delete set null,
  expires_at  timestamptz not null default now() + interval '72 hours',
  created_at  timestamptz not null default now()
);
create index invitations_group_id_idx on public.invitations (group_id);

-- ───────────────────────── 할 일 ─────────────────────────

create table public.task_lists (
  id             bigint generated always as identity primary key,
  group_id       bigint not null references public.groups (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 30),
  display_index  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index task_lists_group_id_idx on public.task_lists (group_id);

-- 반복 규칙. task는 조회할 때 이 규칙으로 만들어진다 (ADR-004 §2)
create table public.recurrings (
  id              bigint generated always as identity primary key,
  group_id        bigint not null references public.groups (id) on delete cascade,
  task_list_id    bigint not null references public.task_lists (id) on delete cascade,
  writer_id       bigint references public.profiles (id) on delete set null,
  name            text not null check (char_length(name) between 1 and 30),
  description     text,
  start_date      date not null,
  frequency_type  text not null check (frequency_type in ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY')),
  week_days       smallint[] not null default '{}',
  month_day       smallint check (month_day between 1 and 31),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint recurrings_weekly_days check (
    frequency_type <> 'WEEKLY'
    or (cardinality(week_days) > 0 and week_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])
  ),
  constraint recurrings_monthly_day check (frequency_type <> 'MONTHLY' or month_day is not null)
);
create index recurrings_task_list_id_idx on public.recurrings (task_list_id);

create table public.tasks (
  id             bigint generated always as identity primary key,
  recurring_id   bigint not null references public.recurrings (id) on delete cascade,
  task_list_id   bigint not null references public.task_lists (id) on delete cascade,
  date           date not null,
  name           text not null,
  description    text,
  -- 그 날짜만 직접 수정했으면 true. 반복 규칙을 수정해도 덮어쓰지 않는다
  is_customized  boolean not null default false,
  done_at        timestamptz,
  done_by        bigint references public.profiles (id) on delete set null,
  writer_id      bigint references public.profiles (id) on delete set null,
  display_index  integer not null default 0,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- 같은 날짜를 동시에 조회해도 한 행만 생긴다
  unique (recurring_id, date)
);
create index tasks_task_list_id_date_idx on public.tasks (task_list_id, date);
create index tasks_done_by_idx on public.tasks (done_by) where done_at is not null;

create table public.task_comments (
  id          bigint generated always as identity primary key,
  task_id     bigint not null references public.tasks (id) on delete cascade,
  user_id     bigint not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index task_comments_task_id_idx on public.task_comments (task_id);

-- ───────────────────────── 게시판 ─────────────────────────

create table public.articles (
  id          bigint generated always as identity primary key,
  writer_id   bigint not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  content     text not null,
  image       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index articles_created_at_idx on public.articles (created_at desc);

create table public.article_likes (
  article_id  bigint not null references public.articles (id) on delete cascade,
  user_id     bigint not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table public.article_comments (
  id          bigint generated always as identity primary key,
  article_id  bigint not null references public.articles (id) on delete cascade,
  writer_id   bigint not null references public.profiles (id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index article_comments_article_id_idx on public.article_comments (article_id, id desc);

-- ───────────────────────── 트리거 ─────────────────────────

create trigger set_updated_at before update on public.profiles         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.groups           for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.task_lists       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.recurrings       for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tasks            for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.task_comments    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.articles         for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.article_comments for each row execute function public.set_updated_at();

-- 새 할 일 목록은 그룹의 맨 뒤에 붙는다
create or replace function public.set_task_list_display_index()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select coalesce(max(display_index) + 1, 0) into new.display_index
  from public.task_lists
  where group_id = new.group_id;
  return new;
end;
$$;

create trigger set_display_index before insert on public.task_lists
  for each row execute function public.set_task_list_display_index();
