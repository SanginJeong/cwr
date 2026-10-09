# Coworkers HR

**근태 정책을 데이터로 다루는 HR 서비스.** 회사가 정책(자율·코어타임·고정)을 데이터로 정하면, 출퇴근 기록은 순수 함수 정책 엔진이 화면에서 매번 판정합니다. 판정 결과를 저장하지 않기 때문에 **정책을 바꾸면 지난 기록도 새 정책으로 다시 판정됩니다.**

팀 프로젝트였던 협업 툴 Coworkers(팀·할 일·게시판)를 HR 서비스의 업무 공간으로 두고, 개인 프로젝트 HR-platform(다님)의 정책 엔진을 합쳐 새로 설계했습니다.

- 데모: **https://cwr-one.vercel.app** → 로그인 화면의 **계정 없이 둘러보기**에서 인사담당자·팀장·직원 중 하나를 고르면 바로 들어갑니다
- 데모 데이터(직원 30명, 팀 4개, 최근 3개월 기록)는 매일 새벽 처음 상태로 돌아갑니다

## 역할별로 할 수 있는 것

| 역할       | 화면                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 직원       | 사이드바 출퇴근 카드, **내 근태**(월 달력·이번 달 요약·오늘), 휴가 신청·취소                       |
| 팀장       | 팀 페이지의 **오늘 우리 팀 근태**, **휴가 승인**(같은 날 겹침 표시), 평일 팀 휴가 달력             |
| 인사담당자 | **구성원 관리**(직원 등록·팀·정책 배정·퇴사), **근태 정책**(만들기·기본 정책), 회사 전체 휴가 승인 |

팀장은 회사 역할이 아니라 팀마다 정해집니다 (한 사람이 A팀 팀장이면서 B팀 팀원일 수 있음).

## 설계에서 고민한 것

### 1. 판정은 저장하지 않는다 ([ADR-007](docs/decisions/ADR-007-attendance.md))

```
DB: 사실(출근·퇴근 시각, 휴가 결정) + 규칙(정책)
          │  attendance_range RPC: 엔진 입력 모양으로 (KST 벽시계 시각, 승인된 휴가만 LEAVE, 서버 기준 오늘)
          ▼
정책 엔진 (순수 TypeScript 함수) → 날짜별 정상 / 지각 / 결근 / 휴가
```

- 정책 엔진(`src/entities/attendance/lib/policy-engine`)은 DB·React·시계에 의존하지 않습니다. 현재 날짜도 인자로 받습니다.
- 판정을 저장하면 정책을 바꾸거나 휴가를 승인할 때마다 다시 계산해 덮어써야 하고, 두 값이 어긋날 수 있습니다.
- 경계값(유예 정확히 N분, 코어 시작 정각, 자정 근처, 주말, 오늘·미래, 입사 전)을 단위 테스트로 고정했습니다.

### 2. 권한은 DB가 확인한다 ([ADR-006](docs/decisions/ADR-006-company-roles.md))

모든 권한은 Postgres RLS와 RPC가 확인하고, 화면의 메뉴 숨김과 라우트 보호(`src/proxy.ts`)는 사용자 경험용입니다.

| 데이터                  | 직원 | 팀장             | 인사담당자       |
| ----------------------- | ---- | ---------------- | ---------------- |
| 내 출퇴근·휴가          | 본인 | 본인 + 팀원      | 전체             |
| 휴가 승인·반려          | -    | 팀원 (본인 제외) | 전체 (본인 제외) |
| 팀 생성·수정, 멤버 배정 | -    | -                | ✓                |
| 직원 등록·퇴사 처리     | -    | -                | ✓ (BFF)          |
| 근태 정책               | 읽기 | 읽기             | 쓰기             |

- 퇴사는 삭제가 아니라 비활성화입니다. `current_profile_id()`가 비활성 계정에 null을 돌려줘서 모든 RLS와 RPC에서 한 번에 막히고, 기록은 남습니다.
- 휴가 승인은 `update ... where status = 'PENDING'`으로 **먼저 처리한 결정만 적용**됩니다 (팀장과 인사담당자가 동시에 눌러도 하나만 반영).
- 계정 생성과 로그인 차단은 Supabase service role이 필요해서 Route Handler(BFF)에서만 합니다. 새 계정은 비활성으로 생기므로 공개 가입이 열려 있어도 아무것도 할 수 없습니다.

### 3. 원클릭 데모 로그인

데모 계정의 비밀번호는 어디에도 저장하지 않습니다. 서버가 로그인할 때마다 service role로 새 비밀번호를 정해 로그인하고 세션 쿠키만 넘깁니다. 면접관이 비밀번호를 바꾸거나 퇴사 처리해도 다음 데모 로그인에서 되돌아오고, 나머지 변경은 매일 크론이 되돌립니다.

## 기술 스택

- **Next.js 16** (App Router, Route Handler를 BFF로), React 19, TypeScript, TailwindCSS
- **TanStack Query v5** (서버 상태), Zustand (로그인 이메일 기억)
- **Supabase**: Auth, Postgres(RLS + RPC), Realtime(팀 접속 상태), Storage
- 폴더 구조: Feature-Sliced Design ([ADR-001](docs/decisions/ADR-001-fsd-folder-structure.md))
- 테스트: 3층 (아래 [테스트](#테스트))
- 배포: Vercel (서울 리전, 매일 데모 리셋 크론)

## 로컬에서 실행

```bash
npm install
cp .env.example .env   # 값 채우기 (아래 표)
npm run dev
```

| 환경변수                                                    | 설명                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 프로젝트                                            |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | 서버 전용. 직원 등록, 퇴사 처리, 데모 로그인·리셋            |
| `CRON_SECRET`                                               | 데모 리셋 엔드포인트 인증 (Vercel Cron이 자동으로 붙여 보냄) |

DB 준비(마이그레이션, Auth 설정, 첫 인사담당자)와 데모 데이터 만들기는 [supabase/README.md](supabase/README.md)에 있습니다.

## 테스트

아래 층에서 확인한 규칙은 위 층에서 다시 세세하게 보지 않습니다 ([ADR-008](docs/decisions/ADR-008-e2e-testing.md)).

| 층        | 도구                                         | 무엇을                                                                                      |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 순수 함수 | **Vitest**                                   | 정책 엔진의 판정 경계값, 날짜(KST), 데모 데이터 생성                                        |
| DB·RLS    | **PGlite** (Docker 없이)                     | 마이그레이션, 역할별 RLS, 출퇴근·휴가 RPC 규칙                                              |
| 화면 흐름 | **Playwright** + Supabase 로컬 스택 (Docker) | 데모 로그인 3종의 핵심 흐름, 역할을 넘나드는 승인(동시 승인 경쟁 포함), 모바일, 접근성(axe) |

- PR마다 P0·P1(데모가 깨지면 바로 보이는 것, 역할별 시나리오)이 CI에서 돕니다. 평일 09:00(KST) nightly는 P2(모바일 일부, 접근성, 스크린샷)까지 전부.
- 테스트 목록과 우선순위: [로드맵 2](docs/roadmap-e2e.md)

```bash
npm test          # Vitest
npm run test:db   # PGlite로 마이그레이션 + DB 테스트
npm run e2e:db && npm run e2e:env   # Supabase 로컬 스택(Docker)과 .env.e2e
npm run test:e2e  # Playwright (원격 DB면 시작하지 않고 멈춘다)
```

## 문서

- [로드맵](docs/roadmap.md): H0~H6 진행 기록, [로드맵 2](docs/roadmap-e2e.md): E2E 테스트
- 결정 기록: [ADR-004 Supabase](docs/decisions/ADR-004-supabase-backend.md), [ADR-006 역할과 계정](docs/decisions/ADR-006-company-roles.md), [ADR-007 근태](docs/decisions/ADR-007-attendance.md), [ADR-008 E2E](docs/decisions/ADR-008-e2e-testing.md)
- 단계별 QA: [docs/qa](docs/qa)
- 팀 프로젝트 시절 README: [docs/legacy-readme.md](docs/legacy-readme.md)
