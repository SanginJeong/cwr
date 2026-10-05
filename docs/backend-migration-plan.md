# 백엔드 재구성 계획: 제공 API → Supabase + BFF

> 상태: **계획 (Draft)**. Phase 1(동작 명세)이 끝나면 ADR-004로 결정을 확정합니다.
> 작성일: 2026-10-05

## 1. 배경

- 지금 백엔드는 교육 과정에서 제공받은 API(`fe-project-cowokers.vercel.app/18-4`)라서 수정할 수 없습니다.
- 추가하려는 기능(팀 게시판, 현재 활동 중, 팀 채팅, AI 주간 리포트)은 **팀 단위 데이터**와 **실시간 연결**이 필요한데, 기존 API로는 만들 수 없습니다.
  - 기존 `/articles`는 `groupId`가 없는 **전체 공용 게시판**입니다.
  - 실시간 채널이 없습니다.
- 기존 API 위에 별도 서버를 얹으면 인증 토큰을 바꿔주는 단계, 멤버십 동기화, FK 없는 외부 ID 같은 문제가 계속 따라옵니다.

## 2. 목표 / 비목표

**목표**

- 기존 기능을 **같은 응답 타입**으로 Supabase에서 다시 구현합니다. 화면 코드(views, widgets, features의 UI)는 거의 바꾸지 않습니다.
- 새 기능(팀 게시판, 현재 활동 중, 채팅, AI 리포트)을 같은 DB와 인증 위에 올립니다.
- 무료 플랜(Supabase Free + Vercel Hobby) 안에서 운영합니다.

**비목표**

- 기존 데이터 마이그레이션은 하지 않습니다. 기존 데이터를 내보낼 방법이 없어서 새로 시작합니다.
- 기존 API와 응답이 바이트 단위까지 같을 필요는 없습니다. **프론트가 쓰는 필드**만 맞춥니다.

## 3. 기술 선택

| 항목      | 선택                                                        | 이유                                                                                                              |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| DB        | Supabase Postgres (`ap-northeast-2` 서울)                   | 데이터가 관계형 구조(User ↔ Membership ↔ Group ─ TaskList ─ Task ─ Comment). FK, cascade, 조인 기반 권한에 적합 |
| 인증      | Supabase Auth (이메일 + 카카오)                             | 카카오 OAuth 기본 지원. JWT를 RLS에서 그대로 사용                                                                 |
| 권한      | RLS 정책                                                    | 단순 CRUD는 클라이언트에서 직접 호출                                                                              |
| 서버 로직 | Postgres 함수(RPC) 또는 Next.js Route Handler(BFF)          | 반복 일정, 초대, 순서 변경, AI 리포트처럼 여러 단계가 필요한 로직                                                 |
| 파일      | Supabase Storage                                            | `postImageUpload(file) => url` 시그니처를 그대로 유지                                                             |
| 실시간    | Supabase Realtime (Presence / Broadcast / Postgres Changes) | Vercel 서버리스는 WebSocket 연결을 유지할 수 없음                                                                 |
| 배포 리전 | Vercel 함수 `icn1`                                          | 기본값인 `iad1`(미국)이면 요청마다 150~200ms가 추가됨                                                             |

검토한 대안: MongoDB Atlas는 인증, 실시간, 파일 저장을 모두 직접 만들어야 하고 데이터 구조도 관계형에 가까워서 제외했습니다.

## 4. 엔드포인트 인벤토리

Swagger 기준 53개이고, 이 중 프론트가 실제로 쓰는 것은 약 37개입니다. **안 쓰는 엔드포인트는 구현하지 않습니다.**

구현 방식 표기:

- **D**: 클라이언트에서 Supabase 직접 호출 + RLS
- **R**: Postgres 함수(RPC)
- **B**: Next.js Route Handler(BFF)
- **A**: Supabase Auth / Storage 기본 기능

### Auth / User

| 엔드포인트                                                     | 사용 | 방식  | 난이도 | 비고                                                                                    |
| -------------------------------------------------------------- | ---- | ----- | ------ | --------------------------------------------------------------------------------------- |
| POST auth/signUp, signIn, refresh-token                        | ✅   | A     | 하     | 세션 관리를 Supabase로 넘기면서 `/api/auth/refresh`와 쿠키 처리를 다시 설계해야 함      |
| POST auth/signIn/KAKAO                                         | ✅   | A     | 중     | `/login/kakao` 리다이렉트 URI, 닉네임/이미지 초기값                                     |
| GET/PATCH/DELETE user                                          | ✅   | D / R | 중     | GET은 `memberships[].group`을 포함한 형태로 조립. DELETE는 연관 데이터 처리 정책이 필요 |
| GET user/history                                               | ✅   | D     | 하     | 완료한 task 목록                                                                        |
| PATCH user/password, send-reset-password-email, reset-password | ✅   | A     | 중     | Supabase의 재설정 메일 흐름에 맞게 `/reset-password` 페이지 수정 필요                   |
| GET user/groups, user/memberships                              | ❌   | -     | -      |                                                                                         |
| POST oauthApps                                                 | ❌   | -     | -      | Supabase 대시보드 설정으로 대체                                                         |

### Group / 초대

| 엔드포인트                                         | 사용 | 방식 | 난이도 | 비고                                                       |
| -------------------------------------------------- | ---- | ---- | ------ | ---------------------------------------------------------- |
| POST groups                                        | ✅   | R    | 하     | 그룹 생성과 생성자 ADMIN 멤버십 생성을 한 트랜잭션으로     |
| GET groups/{id}                                    | ✅   | D    | 중     | members, taskLists(+tasks)를 중첩해서 응답. 형태 확인 필요 |
| PATCH / DELETE groups/{id}                         | ✅   | D    | 하     | ADMIN만 가능(RLS). 하위 데이터는 cascade                   |
| DELETE groups/{id}/member/{userId}                 | ✅   | D    | 중     | 본인 탈퇴와 ADMIN의 강퇴 규칙                              |
| GET groups/{id}/invitation                         | ✅   | R    | 중     | 일회성, 만료 있는 토큰. 형식과 만료 시간 확인 필요         |
| POST groups/accept-invitation                      | ✅   | R    | 중     | `userEmail`을 신뢰하지 않고 JWT 사용자로 처리              |
| GET/POST groups/{id}/member, GET groups/{id}/tasks | ❌   | -    | -      | AI 리포트에서 `groups/{id}/tasks`가 필요할 수 있음         |

### TaskList / Task / Recurring (핵심)

| 엔드포인트                                             | 사용 | 방식 | 난이도   | 비고                                                         |
| ------------------------------------------------------ | ---- | ---- | -------- | ------------------------------------------------------------ |
| POST / PATCH / DELETE task-lists                       | ✅   | D    | 하       | displayIndex 자동 부여                                       |
| GET task-lists/{id}?date                               | ✅   | R    | 상       | 날짜별 task를 포함해서 반환                                  |
| GET tasks?date                                         | ✅   | R    | **최상** | 반복 규칙으로 **가상 task**를 계산하고 실제 task와 병합      |
| PATCH tasks/{taskId}                                   | ✅   | R    | **상**   | 가상 task를 완료하거나 수정하면 실제 행으로 만드는 처리 필요 |
| DELETE tasks/{taskId}                                  | ✅   | R    | 상       | 해당 날짜 한 번만 삭제인지, 반복 전체 삭제인지 확인 필요     |
| POST recurring                                         | ✅   | R    | 중       | `startDate`는 오늘 이후만 허용, 생략 시 오늘                 |
| PATCH recurring/{id}, DELETE tasks/{id}/recurring/{id} | ❌   | -    | -        | 지금 UI에 없음. 나중에 필요하면 추가                         |
| PATCH task-lists/{id}/order, tasks/{id}/order          | ❌   | -    | -        |                                                              |
| POST tasks (레거시)                                    | ❌   | -    | -        |                                                              |

### Comment / Article / Image

| 엔드포인트               | 사용 | 방식 | 난이도 | 비고                                                                                                        |
| ------------------------ | ---- | ---- | ------ | ----------------------------------------------------------------------------------------------------------- |
| task 댓글 CRUD (4)       | ✅   | D    | 하     | 작성자만 수정/삭제(403). 가상 task에 댓글을 달면 실제 행으로 만들어야 하는지 확인 필요                      |
| articles CRUD + 목록 (5) | ✅   | D    | 중     | offset 페이지네이션, `orderBy=recent\|like`, `keyword` 검색. likeCount와 commentCount는 집계 뷰 또는 트리거 |
| articles like / unlike   | ✅   | D    | 하     | 응답으로 갱신된 상세를 반환. 상세의 `isLiked` 필드                                                          |
| article 댓글 CRUD (4)    | ✅   | D    | 중     | 커서 페이지네이션                                                                                           |
| POST images/upload       | ✅   | A    | 하     | 클라이언트에서 Storage로 직접 업로드. 10MB 제한, MIME 검증은 버킷 설정으로                                  |

## 5. Phase 1에서 확인할 동작 (Swagger에 없는 규칙)

✅ 2026-10-05 완료. 결과는 [backend-behavior-spec.md](./backend-behavior-spec.md)에 있습니다. 특히 **권한 확인이 거의 없다는 점(§4.1)**과 **초대 수락이 이메일을 그대로 믿는 문제(§4.3)**는 새 백엔드에서 따라 하지 않습니다.

**반복 일정 / Task (최우선)**

- [x] 가상 task는 언제 실제 행이 되나요? (조회만 해도? 완료할 때? 댓글을 달 때?) 가상 task의 `id`는 무엇인가요?
- [x] WEEKLY `weekDays`가 0=일요일인지 1=월요일인지
- [x] MONTHLY `monthDay=31`이면 30일까지 있는 달에는 어떻게 되나요?
- [x] `date` 쿼리와 `startDate`, `doneAt`의 타임존 기준 (UTC인지 KST인지)
- [x] 반복 task 하나를 삭제하면 그날만 사라지나요, 반복 전체가 사라지나요? `deletedAt`의 의미는?
- [x] 반복 task 하나의 이름을 수정하면 그날에만 적용되나요?
- [x] `done: true`일 때 `doneBy`와 `doneAt`이 설정되는 방식. 다른 팀원도 완료 처리할 수 있나요?
- [x] `user/history`에 들어가는 조건과 정렬 순서
- [x] `displayIndex`의 초기값 규칙

**Group / 권한**

- [x] `GET groups/{id}` 응답 전체 형태 (members와 taskLists가 중첩되는 깊이)
- [x] 멤버(MEMBER)가 그룹 수정/삭제, 할 일 목록 생성/삭제를 할 수 있나요?
- [x] 멤버가 아닌 사용자가 그룹을 조회하면 403인가요 404인가요?
- [x] ADMIN이 그룹을 탈퇴하면 어떻게 되나요? 마지막 멤버가 나가면?
- [x] 초대 토큰의 만료 시간, 재사용 가능 여부, 이미 멤버인 사람이 수락하면?
- [x] 같은 이름의 그룹을 만들 수 있나요? (프론트에서는 `validateTeamName`으로 막고 있음)

**User / Article**

- [x] 회원 탈퇴 시 작성한 게시글, 댓글, 그룹은 어떻게 되나요?
- [x] 닉네임 중복 허용 여부
- [x] 게시글 `keyword` 검색 범위 (제목만? 내용 포함?)
- [x] 비로그인 상태에서의 게시글 상세 응답 차이

## 6. 단계별 계획

### Phase 0. 준비

- [ ] 이 계획 리뷰, §9 열린 질문 결정
- [ ] Supabase 프로젝트 생성 (서울 리전), 카카오 개발자 콘솔에 Supabase 콜백 URL 추가
- [ ] `vercel.json`에 `"regions": ["icn1"]` 추가

### Phase 1. 동작 명세 (§5)

- [x] 테스트 계정으로 시나리오별로 호출하고 요청/응답을 기록
- [x] 결과를 `docs/backend-behavior-spec.md`에 정리
- [x] ADR-004 작성 (Supabase 전환 결정과 반복 일정 모델링 방식) — 초안(Proposed)

### Phase 2. 스키마와 RLS

- [ ] 테이블: `profiles`, `groups`, `memberships`, `task_lists`, `recurrings`, `tasks`, `task_comments`, `articles`, `article_likes`, `article_comments`, `invitations`
- [ ] 반복 일정 모델: `recurrings`(규칙)와 `tasks`(실제 행, 날짜별 예외)를 두고, 조회 함수에서 가상 task를 계산한 뒤 병합. Phase 1 결과에 따라 확정
- [ ] RLS: "그룹 멤버인지"를 확인하는 함수(`is_member(group_id)`, `is_admin(group_id)`)를 기준으로 정책 작성
- [ ] 마이그레이션 파일은 `supabase/migrations/`에서 Supabase CLI로 관리
- [ ] DB 타입 생성 (`supabase gen types`)

### Phase 3. 프론트 어댑터 계층

- [ ] 각 `entities/*/api`, `features/*/api` 함수의 **시그니처와 반환 타입을 그대로 유지**하고, 구현만 Supabase로 교체
- [ ] Supabase 응답을 기존 타입으로 바꾸는 mapper를 엔티티별로 작성
- [ ] 환경변수 `NEXT_PUBLIC_BACKEND=legacy|supabase`로 전환할 수 있게 함 (개발 중 비교용)
- [ ] 인증 교체: 쿠키 기반 middleware, `/api/auth/refresh`, 카카오 콜백을 `@supabase/ssr` 기반으로 변경

### Phase 4. 도메인별 구현 (난이도가 낮은 순서)

1. [ ] Auth, User (가입, 로그인, 카카오, 프로필, 비밀번호)
2. [ ] Image (Storage), `next.config.ts`의 `remotePatterns`
3. [ ] Group, Membership, 초대
4. [ ] TaskList, task 댓글
5. [ ] **Task와 반복 일정** (가장 큰 작업)
6. [ ] Article, 좋아요, 댓글, history

도메인마다 `legacy`와 `supabase` 모드에서 같은 화면, 같은 동작이 나오는지 수동 QA로 확인합니다.

### Phase 5. 전환

- [ ] 기본값을 `supabase`로 바꾸고 배포
- [ ] 한 릴리스 동안 문제가 없으면 legacy 구현과 환경변수 분기를 삭제
- [ ] 활동이 없어 프로젝트가 일시정지되는 것을 막는 핑 크론(Vercel Cron 또는 GitHub Actions)

### Phase 6. 새 기능

1. [ ] 팀 게시판: `team_posts`, `team_post_comments` (기존 article 구조 재사용)
2. [ ] 현재 활동 중: Realtime Presence (팀 채널)
3. [ ] 팀 채팅: `chat_messages` + Realtime, 커서 페이지네이션
4. [ ] ~~AI 주간 리포트~~ **보류 (2026-10-05)**: Claude API가 유료(종량제)라서 보류. 대안 검토 중 (예: LLM 없이 통계 기반 리포트)

## 7. 리스크

| 리스크                                          | 영향                        | 대응                                                                          |
| ----------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| 반복 일정의 숨은 규칙을 놓침                    | 할 일 화면 동작이 달라짐    | Phase 1에서 확인 완료(behavior-spec §2). legacy와 supabase를 나란히 놓고 비교 |
| 인증 교체 범위가 큼 (middleware, refresh, 쿠키) | 로그인 루프나 세션 유실     | Phase 3에서 가장 먼저 처리하고 따로 검증                                      |
| Supabase Free 7일 비활성 시 일시정지            | 포트폴리오 링크 접속 불가   | 핑 크론                                                                       |
| 무료 용량 (DB 500MB, Storage 1GB)               | 이미지가 쌓이면 초과        | 업로드 전에 클라이언트에서 압축, 고아 파일 정리                               |
| Vercel Hobby의 이미지 최적화 한도               | next/image 최적화 중단      | 이미 압축된 이미지는 `unoptimized`                                            |
| 기존 이미지 URL(S3)                             | 기존 백엔드가 종료되면 깨짐 | 데이터를 새로 시작하므로 영향 없음                                            |

## 8. 작업량 추정 (대략)

| Phase                | 규모                     |
| -------------------- | ------------------------ |
| 1. 동작 명세         | 1~2일                    |
| 2. 스키마, RLS       | 2~3일                    |
| 3. 어댑터, 인증 교체 | 2~3일                    |
| 4. 도메인 구현       | 5~8일 (반복 일정이 절반) |
| 5. 전환              | 1일                      |

## 9. 열린 질문

- [ ] 제공받은 백엔드가 언제까지 운영되나요? (전환을 서둘러야 하는지)
- [ ] 기존 데이터를 버리고 새로 시작해도 괜찮은가요? (현재 계획은 "괜찮다"를 전제로 함)
- [ ] 새 기능 우선순위 (§6 Phase 6의 순서가 맞는지)
- [ ] 쓰지 않는 반복 일정 수정/삭제 UI를 이번에 같이 만들지
