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
- `test_signup`, `test_login`, `test_error`, `test_row_count` 헬퍼는 `_shim.sql`에 있습니다.
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

- **Email**
  - 기존 API는 가입하자마자 로그인됐습니다. 똑같이 하려면 "Confirm email"을 끕니다. 켜두면 인증 메일을 확인해야 로그인할 수 있습니다.
  - 가입할 때 닉네임은 `supabase.auth.signUp({ email, password, options: { data: { nickname } } })`로 넘깁니다. `handle_new_user` 트리거가 profiles 행을 만듭니다.
- **Kakao**
  - Providers → Kakao를 켜고, 카카오 개발자 콘솔의 REST API 키와 Client Secret을 넣습니다.
  - 카카오 개발자 콘솔의 Redirect URI에 `https://<프로젝트 ref>.supabase.co/auth/v1/callback`을 추가합니다.
- **URL Configuration**
  - Site URL과 Redirect URLs에 배포 주소와 `http://localhost:3000`을 넣습니다. 비밀번호 재설정 메일의 링크가 이 주소로 갑니다.

### 4. 환경변수

`.env.local`과 Vercel 환경변수에 넣습니다. 값은 대시보드 → Project Settings → API에 있습니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트 ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon(또는 publishable) key>
```

service role(secret) key는 RLS를 우회하므로 **브라우저 코드에 넣지 않습니다.** 서버(BFF)에서 꼭 필요할 때만 씁니다.

### 5. 비활성 일시정지 방지

무료 플랜은 7일 동안 요청이 없으면 프로젝트가 일시정지됩니다. 포트폴리오로 계속 열어두려면 주기적으로 요청을 보내는 크론(Vercel Cron 또는 GitHub Actions)을 둡니다. Phase 5에서 추가합니다.

## 프론트에서 호출할 때

| 기존 API                                    | Supabase                                                             |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `GET /user`                                 | `rpc('get_me')`                                                      |
| `GET /groups/{id}`                          | `rpc('get_group', { p_group_id })`                                   |
| `POST /groups`                              | `rpc('create_group', { p_name, p_image })`                           |
| `PATCH /groups/{id}`, `DELETE /groups/{id}` | `from('groups').update/delete` (ADMIN만)                             |
| `DELETE /groups/{id}/member/{userId}`       | `from('memberships').delete()` (ADMIN이 MEMBER를)                    |
| `GET /groups/{id}/invitation`               | `rpc('create_invitation', { p_group_id })`                           |
| `POST /groups/accept-invitation`            | `rpc('accept_invitation', { p_token })`                              |
| `POST/PATCH/DELETE task-lists`              | `from('task_lists')`                                                 |
| `GET .../tasks?date`                        | `rpc('tasks_for_date', { p_task_list_id, p_date })`                  |
| `GET .../tasks/{id}`                        | `rpc('get_task', { p_task_id })`                                     |
| `PATCH .../tasks/{id}`                      | `rpc('update_task', { p_task_id, p_name, p_description, p_done })`   |
| `DELETE .../tasks/{id}`                     | `rpc('delete_task', { p_task_id })`                                  |
| `POST .../recurring`                        | `rpc('create_recurring', {...})`                                     |
| `GET /user/history`                         | `rpc('user_history')`                                                |
| task 댓글                                   | 조회 `from('task_comment_view')`, 쓰기 `from('task_comments')`       |
| 게시글                                      | 조회 `from('article_view')`, 쓰기 `from('articles')`                 |
| 게시글 좋아요                               | `from('article_likes').insert/delete`                                |
| 게시글 댓글                                 | 조회 `from('article_comment_view')`, 쓰기 `from('article_comments')` |
| `DELETE /user`                              | `rpc('delete_account')`                                              |
| `POST /images/upload`                       | `storage.from('images').upload('{auth uid}/{파일}', file)`           |

- RLS에 막힌 update/delete는 **에러 없이 0건**으로 끝납니다. `.select()`로 결과 행을 받아서 비어 있으면 403/404로 처리하세요.
- RPC 에러 코드: `42501` → 403, `P0002` → 404, `P0001` → 400 (메시지를 그대로 보여줘도 되는 문장)
