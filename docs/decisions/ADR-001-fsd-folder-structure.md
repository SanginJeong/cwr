# ADR-001: 폴더 구조를 Feature-Sliced Design(FSD)으로 전환

## Status
Accepted

## Date
2026-10-05

## Context

현재 구조는 "종류별" 폴더(`common`, `features`, `hooks`, `api`, `stores`, `types`, `utils`, `lib`)와 라우트 폴더 안의 `_components`가 섞여 있습니다. 문제점:

- **이름과 내용이 맞지 않음** — `src/features/`에는 `EmptyState`, `ErrorState`, `LoadingSpinner` 같은 범용 UI가 들어 있고, 실제 "기능"(로그인, 팀 생성, 할 일 생성)은 `app/(route)/*/_components`, `_hooks`, `api/hooks`에 흩어져 있음
- **한 기능이 3~4곳에 분산** — 예: 팀 생성 = `app/(route)/team-creation/_hooks/useTeamCreation.ts` + `_util/resolveTeamImage.ts` + `api/hooks/team-creation/usePostCreateTeam.ts` + `api/axios/team-creation/postCreateTeam.ts` + `api/axios/team-creation/_type/types.ts`
- **라우트 폴더 간 결합** — `app/dashboard/.../DashBoardAllArticles.tsx`가 `../../../../(route)/dashboard/_components/Article/FeedArticleItem`을 import. 라우트를 옮기면 깨짐
- **거대 배럴** — `@/common`, `@/api/hooks`, `@/utils`가 모든 것을 re-export. 의존 방향이 보이지 않고, 순환 import 위험
- **API 레이어가 엔티티가 아닌 엔드포인트 기준** — `api/axios/team-creation`, `api/axios/team-join`, `api/axios/group`이 모두 같은 "팀" 엔티티

## Decision

FSD 레이어 구조를 채택하되, Next.js App Router와 충돌하지 않게 다음과 같이 둡니다.

```
src/
├── app/            # Next.js 라우팅 전용 + FSD app 레이어(전역 provider, 전역 스타일)
│   ├── (public)/ (auth)/ (main)/   → ADR-002
│   ├── api/auth/refresh/route.ts
│   ├── _providers/  # QueryProvider, Toaster
│   └── layout.tsx
├── views/          # FSD "pages" 레이어 (이름 변경 이유는 아래)
├── widgets/
├── features/
├── entities/
└── shared/
```

**`pages` 대신 `views`**: `src/pages/`가 있으면 Next.js가 Pages Router로 인식합니다. FSD 공식 가이드는 Next `app/`을 루트로 빼고 빈 `pages/`를 두는 방식을 제안하지만, 이 프로젝트는 `src/app` 경로를 Storybook·tsconfig·middleware가 이미 전제하고 있어 레이어 이름을 바꾸는 쪽이 변경이 적습니다.

**`src/app/**/page.tsx`는 조립 금지**: 한 줄 re-export만 둡니다.

```tsx
// src/app/(main)/teams/[teamId]/page.tsx
export { TeamPage as default } from "@/views/team";
```

### 레이어 규칙

- 위 레이어는 아래 레이어만 import: `app → views → widgets → features → entities → shared`
- 같은 레이어의 다른 슬라이스 import 금지 (entities끼리는 `@x` 표기로만 예외 허용)
- 슬라이스 외부에서는 `index.ts`(public API)로만 접근. `shared/ui`는 컴포넌트 단위로 `@/shared/ui/button`처럼 접근 (전체 배럴 금지)
- 강제: `steiger`(FSD 공식 linter) 또는 `eslint-plugin-boundaries`를 lint-staged에 추가

### 현재 → FSD 매핑

| 레이어 | 슬라이스 | 현재 위치 |
|---|---|---|
| **shared/ui** | button, input, modal, dropdown, select, icon, portal, progress-bar, progress-badge, date-picker, time-picker, date-item, spinner, empty-state, error-state, page-empty-state, page-layout, save-changes-snackbar, link-button | `common/*`, `features/{EmptyState,ErrorState,LoadingSpinner,PageEmptyState}` |
| **shared/api** | `instance`(axios), `queryClient` | `lib/axios.ts`, `lib/queryClient.ts` |
| **shared/lib** | cn, format-date, format-time, toast, token-storage, use-debounce, use-device, use-dropdown-close, use-form, use-image-upload | `utils/*`, `hooks/*`, `lib/toaster.tsx` |
| **shared/config** | `routes.ts`, env | (신규) |
| **entities/user** | getUser, useGetUser, getHistory, User 타입, Profile·ProfileItem | `api/axios/user`, `api/hooks/user`, `common/Profile`, `types/UserType.ts` |
| **entities/team** | getGroup, useGetGroup, Group 타입, 멤버 표시 UI | `api/axios/group`, `api/hooks/group`, `types/Group` |
| **entities/task-list** | TaskList 타입, getTaskListStatus | `api/axios/task-list/_types`, `utils/getTaskListStatus.ts` |
| **entities/task** | getTasks, getTaskDetail, Task 타입, Todo·TaskListItem 표시 UI, getTaskStatus | `api/axios/task`, `common/Todo`, `features/TaskListItem` |
| **entities/task-comment** | getTaskComments, CommentItem | `api/axios/comment`, `common/Comment` |
| **entities/article** | getArticles(infinite), getArticle, Article 타입, FeedArticleItem·BestArticleCard | `api/axios/article`, `app/(route)/dashboard/_components/Article` |
| **entities/article-comment** | getArticleComments, 타입 | `api/axios/articleComment` |
| **features/auth** | login, signup, kakao-login(+server action), reset-password, logout | `api/axios/auth`, `api/actions/kakaoAuth.ts`, `login/_components`, `signup/_components`, `hooks/useLogout.ts`, `stores/useEmailStore.ts` |
| **features/team** | create-team, join-team, edit-team, delete-team, invite-member, remove-member | `team-creation/*`, `team-join/*`, `team/[teamId]/edit/*`, `team/[teamId]/_components/Modal` |
| **features/task-list** | create / edit / delete task-list | `TaskSection/_internal/Modal`, `TaskListCreateModal` |
| **features/task** | create-task(반복 포함), edit-task, delete-task, toggle-done, export-pdf | `MakeTodoModal`, `TaskItemEditModal`, `useTaskMutations`, `TaskPdfDownloadButton`, `api/axios/recurring` |
| **features/task-comment** | write / edit / delete | `_detail/_hooks/useDetailCommentMutations.ts` |
| **features/article** | write, edit, delete, like, search | `dashboard/write/_components`, `[id]/_components/Modal`, `ArticleLikeButton`, `stores/useArticleSearchStore.ts` |
| **features/article-comment** | write / edit / delete | `[id]/_components/_internal/ArticleComments`, `ArticleEditCommentModal` |
| **features/user** | edit-profile, change-password, delete-account | `my-page/_components`, `my-page/_hook` |
| **widgets** | sidebar, page-header-bar, team-member-widget, team-progress-widget, task-list-board, todo-section, task-detail-panel, article-feed, best-articles, landing-sections, onboarding | `common/Sidebar`, `common/PageHeaderBar`, `team/[teamId]/_components/*`, `task-list/.../TodoSection·TodoHeader·_detail`, `app/dashboard/_components/Section`, `_landing`, `_components/Onboarding` |
| **views** | landing, login, signup, kakao-callback, reset-password, no-team, team-create, team-join, team, team-edit, task-list, board, board-write, board-detail, account, history, not-found | 각 `page.tsx`의 조립 코드 |

판단 기준: **"이름이 명사면 entity, 동사면 feature, 여러 개를 엮은 화면 블록이면 widget"**. 애매하면 일단 상위 레이어에 두고, 두 곳 이상에서 쓰일 때 내립니다.

## Alternatives Considered

### 현재 구조 유지 + 정리만
- Pros: 이동 비용 0, 학습 비용 0
- Cons: 기능 분산·라우트 간 결합 문제가 그대로. 새 기능 추가 시 어디에 둘지 기준이 없음
- Rejected: 문제의 근원이 "배치 기준 부재"라 정리만으로는 재발함

### 라우트 colocation (모든 걸 `app/**/_components`에)
- Pros: Next.js 관례, 라우트만 보면 다 보임
- Cons: 여러 라우트가 공유하는 코드(팀 데이터, Sidebar, PageHeaderBar)의 자리가 없음. 지금의 `../../../../(route)/...` 문제가 바로 이 방식의 한계
- Rejected: 공유 코드가 많은 대시보드형 서비스에 부적합

### 도메인별 모듈 (`src/modules/team`, `src/modules/task` …)
- Pros: FSD보다 단순, 레이어 2단계
- Cons: 모듈 내부 구조·모듈 간 의존 규칙을 직접 정해야 함. 커뮤니티 lint 도구 없음
- Rejected: FSD는 같은 문제를 규칙 + 도구(steiger)로 이미 해결함

### FSD 공식 Next.js 배치 (Next `app/`을 루트로, `src/pages` 유지)
- Pros: FSD 문서와 레이어 이름 일치
- Cons: 루트에 빈 `pages/` 폴더 필요, middleware·Storybook·tsconfig 경로 수정 범위가 큼
- Rejected: `views`로 이름만 바꾸는 쪽이 변경이 적음. 나중에 바꾸기도 쉬움

## Consequences

- 파일 대부분이 이동 → PR이 커짐. 레이어 단위(shared → entities → features → widgets → views)로 나눠 진행, 각 단계에서 빌드 통과 유지
- `git mv`로 이동해 blame 이력 유지
- 거대 배럴 제거로 import 경로가 길어지지만, 의존 방향이 경로에 드러남
- `api/axios` + `api/hooks`의 1파일 1함수 구조가 슬라이스의 `api/` 세그먼트로 합쳐져 파일 수가 줄어듦
- 팀원이 FSD를 알아야 함 → 위 매핑 표와 "명사/동사/블록" 기준을 README에 링크
- Storybook `stories` glob, `lint-staged`, `tsconfig` path 업데이트 필요
