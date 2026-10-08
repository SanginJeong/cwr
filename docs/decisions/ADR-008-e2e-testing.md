# ADR-008: E2E 테스트 전략 (Playwright)

## Status

Accepted (2026-10-08, 사용자 결정: DB는 Supabase 로컬 스택)

## Date

2026-10-08

## Context

- 데모(https://cwr-one.vercel.app)가 배포되어 면접관이 들어온다. 화면 흐름은 지금까지 손으로 QA했다 ([docs/qa](../qa)).
- 테스트는 두 층이 있다: 순수 함수(Vitest), DB·RLS(PGlite). 화면 흐름과 역할 간 상호작용(신청 → 승인 → 달력)은 고정되어 있지 않다.
- 로컬 개발과 배포가 **같은 Supabase 프로젝트**를 쓴다. E2E는 출근·휴가처럼 데이터를 바꾼다.
- 출퇴근·휴가 규칙은 DB의 서버 시각(`now()`, `today_kst()`)을 쓴다. 출근은 하루 한 번이다.
- 계획과 테스트 목록: [로드맵 2](../roadmap-e2e.md)

## Decision

### 1. 도구: 스펙은 `@playwright/test`, Playwright MCP는 작성 도구

- 테스트는 `e2e/` 아래 `@playwright/test` 스펙 파일로 남기고, CI는 이 파일만 실행한다.
- Playwright MCP는 에이전트가 화면을 탐색해 시나리오와 셀렉터를 확인하고, 실패한 테스트를 재현·디버깅하는 데 쓴다. MCP 세션의 결과를 테스트로 취급하지 않는다.

### 2. DB: Supabase 로컬 스택 (Docker)

- E2E는 `supabase start`로 띄운 로컬 스택(Postgres, Auth, PostgREST, Realtime)에 대고 돌린다. 마이그레이션은 `supabase db reset`, 데이터는 기존 `GET /api/cron/reset-demo`로 만든다 (데모와 같은 시드).
- CI는 매 실행마다 새 스택이라 서로 섞이지 않는다. 운영 데이터와 데모 데이터에 영향이 없다.
- H2에서 "DB 테스트는 Docker 없이 PGlite"로 정했다. DB 테스트는 그대로 PGlite로 두고, **Auth까지 필요한 E2E만 Docker를 쓴다.**

### 3. 시간

- 브라우저 시계는 조작하지 않는다 (서버 시각과 어긋남).
- 데이터를 바꾸는 스펙은 시작할 때 `reset-demo`로 되돌린다. 데모 로그인 계정은 오늘 출근 기록이 비어 있게 시드된다.
- 날마다 달라지는 시드에 대해 정확한 숫자 대신 변하지 않는 성질로 단언한다 (요약 합계 = 달력 칩 수 등).
- 주말에만 결과가 달라지는 스펙은 주말에 건너뛴다. KST 자정 근처에는 돌리지 않는다.

### 4. 셀렉터와 기다리기

- `getByRole`·`getByLabel` 우선. 이름이 없는 요소는 테스트 전에 접근성을 고쳐 이름을 붙인다 (로드맵 2 E1).
- `data-testid`는 달력 칸처럼 의미 있는 이름이 없는 곳에만.
- 고정 대기 금지. web-first 단언과 응답 대기만.

### 5. 실행 범위

- 데이터를 바꾸는 스펙은 직렬, 읽기 스펙은 병렬.
- PR마다: P0·P1. nightly(평일): 전체 (모바일, 접근성 포함).

## Alternatives Considered

### E2E 전용 Supabase 프로젝트

- Pros: Docker 없이 로컬에서 바로 실행
- Cons: 동시에 도는 CI 실행끼리 데이터가 섞인다. 무료 플랜 일시정지·키 관리. 한 계정의 무료 프로젝트 수(2개)를 쓴다
- Rejected

### 지금 프로젝트에 데모와 다른 계정으로

- Cons: 운영·데모 데이터와 섞이고, 면접관의 조작이 테스트를 깨뜨린다
- Rejected

### Playwright MCP만으로 테스트 (스펙 파일 없이)

- Pros: 자연어로 시나리오를 바로 실행
- Cons: 결과가 매번 달라질 수 있고 CI에서 돌릴 수 없다. 회귀 테스트로 쓸 수 없다
- Rejected (작성·디버깅 도구로만)

## Consequences

- 로컬에서 E2E를 돌리려면 Docker(Docker Desktop 또는 OrbStack)가 필요하다.
- 시드가 로컬 스택에서도 돌아야 한다: `reset-demo`는 Supabase URL·키만 바꾸면 된다 (`.env.e2e`).
- 팀 채팅 ADR은 009로 미룬다.
