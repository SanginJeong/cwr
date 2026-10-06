# Supabase

Coworkers의 새 백엔드입니다. 결정 배경은 [ADR-004](../docs/decisions/ADR-004-supabase-backend.md)에, 진행 상황은 [backend-migration-plan.md](../docs/backend-migration-plan.md)에 있습니다.

```
supabase/
├── migrations/   실제 DB에 적용하는 SQL (순서대로)
└── tests/        npm run test:db로 실행하는 테스트
    └── _shim.sql 테스트 전용. Supabase의 auth/storage 스키마와 기본 권한을 흉내 냄. 실제 DB에는 적용하지 않음
```

## 테스트

```bash
npm run test:db            # 전체
npm run test:db -- tasks   # 파일 이름에 "tasks"가 들어간 것만
```

PGlite(WASM으로 돌아가는 Postgres)로 마이그레이션을 적용한 뒤 테스트를 실행합니다. Docker나 Supabase 프로젝트가 없어도 됩니다.

- 테스트 파일은 실패하면 예외를 던지는 SQL입니다. 각 파일은 새 DB에서 실행됩니다.
- `test_signup`(활성 계정 생성, 회사 역할 지정 가능), `test_create_team`, `test_add_member`, `test_login`, `test_error`, `test_row_count` 헬퍼는 `_shim.sql`에 있습니다.
- 주의: 함수 호출과 그 결과 확인을 **한 SQL 문**에 쓰면, 같은 스냅샷이라 함수가 바꾼 데이터가 보이지 않습니다. 두 문장으로 나눠서 확인하세요.

## 실제 프로젝트에 적용하기 (Phase 0)

### 1. 프로젝트 만들기

- [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다. **Region은 Northeast Asia (Seoul)**로 선택합니다.
- Supabase CLI 설치: `brew install supabase/tap/supabase`

### 2. 마이그레이션 적용

```bash
supabase login
supabase init                         # config.toml 생성 (migrations 폴더는 그대로 둠)
supabase link --project-ref <프로젝트 ref>
supabase db push                      # supabase/migrations/*.sql 적용
```

### 3. Auth 설정 (대시보드 → Authentication)

- **Sign In / Providers**
  - **"Allow new users to sign up"을 끕니다.** 계정은 인사담당자가 직원 등록 BFF(`POST /api/admin/employees`)로 만듭니다 (ADR-006). 끄는 것을 잊어도 스스로 가입한 계정은 비활성이라 아무것도 할 수 없습니다.
  - Kakao provider는 쓰지 않습니다(H1에서 제거). 켜져 있다면 끕니다.
- **URL Configuration**
  - Site URL과 Redirect URLs에 배포 주소와 `http://localhost:3000`을 넣습니다. 비밀번호 재설정 메일의 링크가 이 주소로 갑니다.

### 4. 환경변수

`.env.local`과 Vercel 환경변수에 넣습니다. 값은 대시보드 → Project Settings → API에 있습니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트 ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon(또는 publishable) key>
```

서버(BFF)에서만 쓰는 값도 넣습니다. `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

```
SUPABASE_SERVICE_ROLE_KEY=<service_role(또는 secret) key>
```

service role key는 RLS를 우회하므로 **브라우저 코드에 넣지 않습니다.** 직원 등록과 퇴사 처리(Auth admin API)에만 씁니다 (`src/shared/api/supabase/admin.ts`).

### 5. 첫 인사담당자 지정

직원 등록은 인사담당자만 할 수 있으므로 첫 인사담당자는 SQL로 정합니다 (대시보드 → SQL Editor).

```sql
update public.profiles set company_role = 'HR_ADMIN', is_active = true where email = '<이메일>';
```

계정이 아직 없으면 대시보드 → Authentication → Add user로 만든 뒤(Auto Confirm 체크) 위 SQL을 실행합니다.

### 6. 데모 데이터 만들기 (roadmap H6)

데모 회사(직원 30명 `@coworkers.test`, 팀 4개, 정책 3종, 최근 3개월 출퇴근·휴가, 할 일 샘플)는 `GET /api/cron/reset-demo`가 만듭니다.
다시 실행해도 같은 결과가 나오고(같은 날 기준), 데모 계정·팀의 데이터만 지우고 다시 만듭니다. 그 밖의 계정과 팀은 건드리지 않습니다.

처음 한 번은 로컬 개발 서버를 띄우고 직접 호출합니다 (`.env`에 `CRON_SECRET` 필요).

```bash
curl -s -H "Authorization: Bearer $(grep '^CRON_SECRET=' .env | cut -d= -f2-)" http://localhost:3000/api/cron/reset-demo
```

응답의 `users`, `records`, `leaves`가 생성된 수입니다. 그 뒤로는 배포한 서버의 Vercel Cron이 매일 03:00 KST에 부릅니다.

### 7. 비활성 일시정지 방지

무료 플랜은 7일 동안 요청이 없으면 프로젝트가 일시정지됩니다. 위의 데모 리셋 크론이 매일 DB에 요청을 보내므로 따로 둘 필요가 없습니다.

### 8. Vercel 배포

1. Vercel에서 이 저장소를 Import (Framework: Next.js). 리전은 `vercel.json`의 `icn1`(서울)
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
3. 배포 후 Supabase 대시보드 → Authentication → URL Configuration
   - Site URL: 배포 주소 (`https://<프로젝트>.vercel.app`)
   - Redirect URLs: `https://<프로젝트>.vercel.app/**` (비밀번호 재설정 메일 링크)
4. Vercel → Settings → Cron Jobs에 `/api/cron/reset-demo`가 보이는지 확인. 한 번 수동 실행(Run)해 데모 데이터를 오늘 기준으로 만든다

## 프론트

2026-10-06부터 앱은 Supabase만 씁니다 (기존 API 코드 삭제, roadmap H0).

- `.env`에서 쓰는 값은 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`입니다 (`.env.example`). 예전 값(`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_KAKAO_*`, `NEXT_PUBLIC_BACKEND`)은 지워도 됩니다.
- API 함수(`*/api/*.ts`)는 화면이 쓰던 시그니처를 유지하고, 구현은 옆의 `*.supabase.ts`에 있습니다.

## DB 타입

```bash
npm run db:types   # 연결된 프로젝트의 스키마로 src/shared/api/supabase/database.types.ts 생성
```

- 마이그레이션을 `db push`한 뒤에 실행하고, 생성된 파일을 함께 커밋합니다. 직접 고치지 않습니다(lint·prettier 제외).
- 생성된 타입이 표현하지 못하는 것은 `src/shared/api/supabase/types.ts`에서 보완합니다.
  - jsonb를 돌려주는 RPC: `RpcJsonReturns`에 응답 모양을 선언하고 `rpcJson("get_me", data)`로 읽습니다. SQL의 `*_json` 함수를 바꾸면 여기도 바꿔야 합니다.
  - 뷰: 컬럼이 모두 nullable로 생성되므로 `ViewRow<"article_view", "image">`처럼 실제로 null이 될 수 있는 컬럼만 지정합니다.

## 프론트에서 호출할 때

| 기존 API                                    | Supabase                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /user`                                 | `rpc('get_me')`                                                                                   |
| `GET /groups/{id}`                          | `rpc('get_group', { p_group_id })`                                                                |
| `POST /groups`                              | `rpc('create_group', { p_name, p_image })` (인사담당자만)                                         |
| `PATCH /groups/{id}`, `DELETE /groups/{id}` | `from('groups').update/delete` (인사담당자만)                                                     |
| `DELETE /groups/{id}/member/{userId}`       | `from('memberships').delete()` (인사담당자만)                                                     |
| 멤버 배정·팀장 지정                         | `from('memberships').insert/update({ role })` (인사담당자만)                                      |
| 직원 등록                                   | `POST /api/admin/employees` (BFF)                                                                 |
| 출근 / 퇴근                                 | `rpc('clock_in')` / `rpc('clock_out')`                                                            |
| 근태 조회 (엔진 입력)                       | `rpc('attendance_range', { p_from, p_to, p_user_id? })`                                           |
| 팀 근태 (팀장·인사담당자)                   | `rpc('team_attendance_range', { p_group_id, p_from, p_to })`                                      |
| 휴가 신청 / 취소 / 승인·반려                | `rpc('request_leave')` / `rpc('cancel_leave')` / `rpc('decide_leave')`                            |
| 휴가 목록                                   | `from('leave_requests')` (본인·팀장·인사담당자 RLS)                                               |
| 근태 정책                                   | `from('policies')` (쓰기는 인사담당자), `rpc('set_default_policy')`, `rpc('set_employee_policy')` |
| 퇴사 처리·복직                              | `PATCH /api/admin/employees/{userId}` (BFF)                                                       |
| `POST/PATCH/DELETE task-lists`              | `from('task_lists')`                                                                              |
| `GET .../tasks?date`                        | `rpc('tasks_for_date', { p_task_list_id, p_date })`                                               |
| `GET .../tasks/{id}`                        | `rpc('get_task', { p_task_id })`                                                                  |
| `PATCH .../tasks/{id}`                      | `rpc('update_task', { p_task_id, p_name, p_description, p_done })`                                |
| `DELETE .../tasks/{id}`                     | `rpc('delete_task', { p_task_id })`                                                               |
| `POST .../recurring`                        | `rpc('create_recurring', {...})`                                                                  |
| `GET /user/history`                         | `rpc('user_history')`                                                                             |
| task 댓글                                   | 조회 `from('task_comment_view')`, 쓰기 `from('task_comments')`                                    |
| 게시글                                      | 조회 `from('article_view')`, 쓰기 `from('articles')`                                              |
| 게시글 좋아요                               | `from('article_likes').insert/delete`                                                             |
| 게시글 댓글                                 | 조회 `from('article_comment_view')`, 쓰기 `from('article_comments')`                              |
| `POST /images/upload`                       | `storage.from('images').upload('{auth uid}/{파일}', file)`                                        |

- RLS에 막힌 update/delete는 **에러 없이 0건**으로 끝납니다. `.select()`로 결과 행을 받아서 비어 있으면 403/404로 처리하세요.
- RPC 에러 코드: `42501` → 403, `PT404` → 404, `P0001` → 400 (메시지를 그대로 보여줘도 되는 문장). `P0002`는 PostgREST가 HTTP 500으로 돌려주므로 쓰지 않는다
