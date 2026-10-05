# 리팩토링 체크리스트

> 기준: `main@050a061` (2026-10-05) · 근거 자료: [user-flowchart.html](./user-flowchart.html)
> 구조 변경의 이유와 대안은 ADR에 있습니다 → [ADR-001 FSD 폴더 구조](./decisions/ADR-001-fsd-folder-structure.md) · [ADR-002 라우트 재설계](./decisions/ADR-002-route-restructure.md)

진행 순서는 **Phase 0 → 4**. 각 Phase는 별도 PR로, PR마다 `npm run build`와 `npm run build-storybook`이 통과해야 다음으로 넘어갑니다.

---

## Phase 0. 버그 수정 (구조 변경 전에 먼저)

- [x] **토큰 재발급 라우트가 등록되지 않음** — `src/app/api/auth/refresh/route.ts`로 이동, 인터셉터는 `/api/auth/refresh` 호출
  - `src/lib/axios.ts`의 401 인터셉터가 `fetch("/auth/refresh-token")`(같은 origin)을 호출하는데, 핸들러가 `src/api/axios/auth/refresh/route.ts`에 있어 Next 라우트가 아님 → 항상 404 → 재발급 실패
  - 수정: `src/app/auth/refresh-token/route.ts`로 이동 (ADR-002 이후엔 `src/app/api/auth/refresh/route.ts`)하고 인터셉터 URL 맞추기
  - 검증: accessToken 쿠키만 삭제 후 API 호출 → 재발급되어 요청이 재시도되는지 확인
- [x] **middleware 중복 분기 제거** — `src/middleware.ts` 20행과 23행이 같은 `/team` 비로그인 체크
- [x] ~~**게시판 무한스크롤 observer**~~ — 재확인 결과 sentinel `<div ref>`가 항상 마운트되어 있어 문제 없음. 변경 안 함
- [ ] **게시판 검색어 잔류** — `useArticleSearchStore`의 keyword가 페이지 이탈 후에도 남음 (Phase 4에서 URL 쿼리로 옮기면 함께 해결)

## Phase 1. 의존성 정리

- [x] `dayjs` 제거 — `src/utils/formatDate.ts` 한 곳뿐. `date-fns`의 `format(date, "yyyy년 M월 d일")`로 교체 후 `npm uninstall dayjs`
- [x] ~~`web-vitals` 제거 또는 개발 전용으로~~ — 재확인 결과 이미 `NODE_ENV === "development"`일 때만 dynamic import. 유지
- [x] `@tanstack/react-query-devtools` → `devDependencies`로 이동
- [x] `svgo` 제거 (어디서도 참조 안 함)
- [x] `babel-plugin-react-compiler` 제거 (켜는 건 동작 변경이라 별도 작업으로)
- [x] 애니메이션 라이브러리 단일화 검토 → [ADR-003](./decisions/ADR-003-keep-gsap-for-landing.md): 랜딩 gsap 유지 — `gsap`+`@gsap/react`(랜딩 섹션 5개만) vs `framer-motion`(Sidebar·온보딩·게시판)
  - 랜딩의 ScrollTrigger 효과를 framer-motion `useScroll`/`whileInView`로 옮길 수 있으면 gsap 2개 제거
  - 결정 내용은 ADR-003으로 남길 것

## Phase 2. 미사용 코드 삭제

- [x] `src/api/axios/auth/refresh/route.ts` (Phase 0에서 이동)
- [x] `src/app/(route)/my-history/_components/ScheduleDaySection/` (컴포넌트 + stories)
- [x] `src/app/(route)/my-history/_constants/` (`index.ts`, `STYLE_TOKENS.ts`)
- [x] `src/app/(route)/dashboard/write/_constants/MAX_IMAGE_SIZE.ts`
- [x] `src/stores/store.ts` (빈 store)
- [x] `src/constants/` (빈 `index.ts`, `.gitkeep`)
- [x] `src/app/(route)/signup/_type/`
- [x] `src/app/(route)/my-page/_components/index.ts` (안 쓰는 배럴)
- [ ] ~~`src/common/Comment/_internal/index.ts`~~ — `CommentItem.stories.tsx`가 사용 중이라 유지
- [x] `src/app/(route)/login/_constants/.gitkeep`, `login/_types/.gitkeep` (빈 폴더)
- [x] `src/types/` 중 import되지 않는 타입 파일 삭제 (`DateType`, `ToastType`)

> `src/utils/customPlugins.ts`는 `tailwind.config.ts`가 사용 → **삭제하지 말 것**

## Phase 3. FSD 폴더 구조 전환 ([ADR-001](./decisions/ADR-001-fsd-folder-structure.md))

- [x] 3-1. 레이어 골격 생성 + `tsconfig` path alias + import 규칙 lint 도입 → 새 의존성 없이 `eslint.config.mjs`의 `no-restricted-imports`로 구현
- [x] 3-2. `shared` 이동 — `common/*` UI, `features/*`(EmptyState 등 범용 UI), `lib/*`, `utils/*`, `hooks/*`(범용), `assets/`
- [x] 3-3. `entities` 이동 — user, team(group), task-list, task, task-comment, article, article-comment (api 함수 + 쿼리 훅 + 타입 + 표시용 UI)
- [x] 3-4. `features` 이동 — 사용자 행동 단위 (로그인, 팀 생성, 할 일 생성, 좋아요 …)
- [x] 3-5. `widgets` 이동 — Sidebar, PageHeaderBar, 팀 위젯, 할 일 섹션, 게시글 피드, 랜딩 섹션
- [x] 3-6. `views` 생성 — 라우트별 화면 조립. `src/app/**/page.tsx`는 `views`를 re-export하는 한 줄짜리로
- [x] 3-7. 거대 배럴(`@/common`, `@/api/hooks`, `@/utils`) 제거 → 슬라이스별 `index.ts`만 공개 API로
- [x] 3-8. 상대경로로 라우트 폴더를 넘나드는 import 0개 확인 (예: `DashBoardAllArticles.tsx`의 `../../../../(route)/dashboard/...`)
- [x] 3-9. Storybook `stories` 경로 glob 확인 (`src/**`라 변경 불필요)

- [x] 3-10. 이동 후 레이어 규칙 위반 5건 정리 (ADR-001 "구현 메모" 참고)
- [x] 3-11. `madge --circular` 순환 import 0건, headless Chrome으로 전 페이지 런타임 에러 0건 확인
  - ⚠️ `/team/[teamId]/**`는 실제 토큰이 필요해 자동 확인 못 함 → 로그인 후 수동 확인 필요

## Phase 4. 라우트 재설계 ([ADR-002](./decisions/ADR-002-route-restructure.md))

- [x] 4-1. `shared/config/routes.ts`에 경로 상수/빌더 정의, 하드코딩된 `href`·`router.push` 55곳 교체
- [x] 4-2. `src/app`을 route group `(public)` / `(auth)` / `(main)`으로 재구성, `/dashboard` 두 폴더 분산 해소
  - `(auth)/layout.tsx`로 `CenteredCardLayout` 공통화는 보류 (각 페이지가 이미 감싸고 있어 동작 차이 없음)
- [x] 4-3. URL 변경 + `next.config.ts` `redirects()`로 구 URL 호환 (`permanent: false`)
  - [ ] 배포 후 문제 없으면 `permanent: true`로 변경, 한 릴리스 뒤 제거
- [x] 4-4. middleware는 쿠키 검사만. 팀 존재 확인 → `app/(main)/teams/[teamId]/layout.tsx`, 첫 팀 리다이렉트 → `views/no-team`
- [x] 4-5. 쿼리 파라미터 정리 — `?task-id=` → `?task=` (구 이름도 읽음), `?w=true` → `?modal=new-task`
  - [ ] `?date=`를 `yyyy-MM-dd`로 바꾸는 건 **보류**: 값이 API에 그대로 전달되고, 주 이동 시 현재 시각이 포함된 ISO가 전송됨. 서버의 날짜 해석(UTC 기준 여부)을 확인한 뒤 진행
- [x] 4-6. 게시판 검색어·정렬을 Zustand → `?q=`, `?sort=like` 쿼리로 (`useArticleSearchStore` 삭제)
- [x] 4-7. **변경하면 안 되는 URL 유지 확인** — `/reset-password?token=`, `/login/kakao`
- [ ] 4-8. 전 플로우 수동 점검 (실제 계정 필요): 가입 → 온보딩 → 팀 생성 → 목록 생성 → 할 일 생성/상세/삭제 → PDF → 게시판 글쓰기/상세/삭제 → 계정 설정 → 로그아웃 → 카카오 로그인 → 비밀번호 재설정
  - 자동 확인한 것: 비로그인/가짜 토큰으로 전 페이지 렌더링·런타임 에러 0, 구 URL redirect, 보호 경로 redirect, 잘못된 팀 ID redirect, 게시판 검색/정렬 URL 반영
  - 자동 확인 못 한 것: 실제 토큰이 필요한 `/teams/[teamId]/**` 화면, `/teams` → 첫 팀 redirect, 각종 mutation 후 이동

---

## 완료 조건

- [x] `npm run build`, `npm run build-storybook`, `npm run lint` 통과 (lint는 기존 warning 17건만 남음)
- [x] FSD import 규칙 lint 위반 0
- [x] 구 URL 접속 시 새 URL로 리다이렉트
- [x] `user-flowchart.html`을 새 구조 기준으로 갱신
