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
- [ ] `src/app/(route)/my-history/_components/ScheduleDaySection/` (컴포넌트 + stories)
- [ ] `src/app/(route)/my-history/_constants/` (`index.ts`, `STYLE_TOKENS.ts`)
- [ ] `src/app/(route)/dashboard/write/_constants/MAX_IMAGE_SIZE.ts`
- [ ] `src/stores/store.ts` (빈 store)
- [ ] `src/constants/` (빈 `index.ts`, `.gitkeep`)
- [ ] `src/app/(route)/signup/_type/`
- [ ] `src/app/(route)/my-page/_components/index.ts` (안 쓰는 배럴)
- [ ] `src/common/Comment/_internal/index.ts` (안 쓰는 배럴)
- [ ] `src/app/(route)/login/_constants/.gitkeep`, `login/_types/.gitkeep` (빈 폴더)
- [ ] `src/types/` 중 import되지 않는 타입 파일 확인 후 삭제 (`tsc --noEmit`로 확인)

> `src/utils/customPlugins.ts`는 `tailwind.config.ts`가 사용 → **삭제하지 말 것**

## Phase 3. FSD 폴더 구조 전환 ([ADR-001](./decisions/ADR-001-fsd-folder-structure.md))

- [ ] 3-1. 레이어 골격 생성 + `tsconfig` path alias + import 규칙 lint(steiger 또는 `eslint-plugin-boundaries`) 도입
- [ ] 3-2. `shared` 이동 — `common/*` UI, `features/*`(EmptyState 등 범용 UI), `lib/*`, `utils/*`, `hooks/*`(범용), `assets/`
- [ ] 3-3. `entities` 이동 — user, team(group), task-list, task, task-comment, article, article-comment (api 함수 + 쿼리 훅 + 타입 + 표시용 UI)
- [ ] 3-4. `features` 이동 — 사용자 행동 단위 (로그인, 팀 생성, 할 일 생성, 좋아요 …)
- [ ] 3-5. `widgets` 이동 — Sidebar, PageHeaderBar, 팀 위젯, 할 일 섹션, 게시글 피드, 랜딩 섹션
- [ ] 3-6. `views` 생성 — 라우트별 화면 조립. `src/app/**/page.tsx`는 `views`를 re-export하는 한 줄짜리로
- [ ] 3-7. 거대 배럴(`@/common`, `@/api/hooks`, `@/utils`) 제거 → 슬라이스별 `index.ts`만 공개 API로
- [ ] 3-8. 상대경로로 라우트 폴더를 넘나드는 import 0개 확인 (예: `DashBoardAllArticles.tsx`의 `../../../../(route)/dashboard/...`)
- [ ] 3-9. Storybook `stories` 경로 glob 업데이트 (`.storybook/main.ts`)

## Phase 4. 라우트 재설계 ([ADR-002](./decisions/ADR-002-route-restructure.md))

- [ ] 4-1. `shared/config/routes.ts`에 경로 상수/빌더 정의, 하드코딩된 `href`·`router.push` 전부 교체
- [ ] 4-2. `src/app`을 route group `(public)` / `(auth)` / `(main)`으로 재구성, `/dashboard` 두 폴더 분산 해소
- [ ] 4-3. URL 변경 + `next.config.ts` `redirects()`로 구 URL 호환 (처음엔 `permanent: false`)
- [ ] 4-4. middleware의 보호 경로 목록을 `routes.ts` 상수 기반으로 변경
- [ ] 4-5. 쿼리 파라미터 정리 — `?task-id=` → `?task=`, `?w=true` → `?modal=new-task`, `?date=`는 ISO 문자열 대신 `yyyy-MM-dd`
- [ ] 4-6. 게시판 검색어를 Zustand → `?q=` 쿼리로 (`useArticleSearchStore` 삭제)
- [ ] 4-7. **변경하면 안 되는 URL 확인**
  - `/reset-password?token=` — 비밀번호 재설정 메일 링크가 이 경로를 씀 (`ResetPassword.tsx`가 `redirectUrl = origin`을 보냄)
  - `/login/kakao` — 카카오 콘솔에 등록된 Redirect URI(`NEXT_PUBLIC_KAKAO_REDIRECT_LOGIN_URI`). 바꾸려면 콘솔·env·Vercel 환경변수를 같이 수정
- [ ] 4-8. 전 플로우 수동 점검: 가입 → 온보딩 → 팀 생성 → 목록 생성 → 할 일 생성/상세/삭제 → PDF → 게시판 글쓰기/상세/삭제 → 계정 설정 → 로그아웃 → 카카오 로그인 → 비밀번호 재설정

---

## 완료 조건

- [ ] `npm run build`, `npm run build-storybook`, `npm run lint` 통과
- [ ] FSD import 규칙 lint 위반 0
- [ ] 구 URL 접속 시 새 URL로 리다이렉트
- [ ] `user-flowchart.html`을 새 구조 기준으로 갱신
