# ADR-002: 라우트(URL)와 app 폴더 재설계

## Status

Accepted

## Date

2026-10-05

## Context

현재 URL과 `src/app` 구조의 문제:

- **같은 리소스인데 URL 규칙이 제각각**: `/team/[teamId]`, `/team-creation`, `/team-join`. 팀 관련 URL이 세 갈래로 흩어짐
- **이름이 기능과 다름**: `/dashboard`는 자유게시판. `/my-page`는 계정 설정
- **한 URL이 두 폴더로 분산**: `/dashboard`는 `src/app/dashboard/`(page·layout), `/dashboard/[id]`·`/dashboard/write`는 `src/app/(route)/dashboard/`. 그래서 `app/dashboard/layout.tsx`가 상세·글쓰기에는 적용되지 않음
- **route group이 의미가 없음**: `(route)` 하나에 공개·인증·보호 페이지가 모두 들어 있음
- **경로 하드코딩**: `href`와 `router.push`에 경로 문자열이 약 50곳 흩어져 있고, middleware의 보호 경로 목록도 별도로 관리됨
- **쿼리 파라미터 이름이 불명확**: `?w=true`(할 일 생성 모달), `?task-id=`, `?date=2026-10-05T00:00:00.000Z`(ISO 전체)
- **middleware가 매 요청마다 API 호출**: `/team`은 `GET /user`, `/team/:id`는 `GET /groups/:id`를 링크 prefetch를 포함해 매번 호출함

## Decision

### 1. URL 매핑

| 현재                                    | 변경                             | 비고                                                 |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| `/`                                     | `/`                              |                                                      |
| `/login`                                | `/login`                         |                                                      |
| `/login/kakao`                          | `/login/kakao`                   | **유지**: 카카오 콘솔의 Redirect URI                 |
| `/signup`                               | `/signup`                        |                                                      |
| `/reset-password?token=`                | `/reset-password?token=`         | **유지**: 재설정 메일 링크                           |
| `/team`                                 | `/teams`                         | 소속 팀이 없을 때의 안내. 팀이 있으면 첫 팀으로 이동 |
| `/team-creation`                        | `/teams/new`                     |                                                      |
| `/team-join`                            | `/teams/join`                    |                                                      |
| `/team/[teamId]`                        | `/teams/[teamId]`                |                                                      |
| `/team/[teamId]/edit`                   | `/teams/[teamId]/edit`           |                                                      |
| `/team/[teamId]/task-list/[taskListId]` | `/teams/[teamId]/lists/[listId]` |                                                      |
| `?task-id=12`                           | `?task=12`                       | 할 일 상세 패널                                      |
| `?w=true`                               | `?modal=new-task`                | 할 일 생성 모달                                      |
| `?date=<ISO>`                           | `?date=2026-10-05`               | 타임존 문제도 함께 줄어듦 (커밋 050a061 참고)        |
| `/dashboard`                            | `/board`                         | 검색어는 Zustand에서 `?q=`, 정렬은 `?sort=like`로    |
| `/dashboard/write`                      | `/board/new`                     |                                                      |
| `/dashboard/[id]`                       | `/board/[articleId]`             |                                                      |
| `/my-page`                              | `/account`                       |                                                      |
| `/my-history`                           | `/history`                       |                                                      |

규칙은 세 가지입니다.

- 컬렉션은 복수형으로 씁니다 (`/teams`).
- 생성은 `/new`, 수정은 `/edit`으로 씁니다.
- 화면 상태(모달, 선택된 항목, 필터)는 쿼리 파라미터에 둡니다.

### 2. app 폴더 구조

```
src/app/
├── layout.tsx                    # html, font, providers, Sidebar
├── not-found.tsx
├── (public)/
│   └── page.tsx                  # 랜딩
├── (auth)/                       # 로그인 상태면 / 로 (middleware)
│   ├── layout.tsx                # CenteredCardLayout
│   ├── login/page.tsx
│   ├── login/kakao/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (main)/                       # 비로그인이면 /login 으로 (middleware)
│   ├── teams/
│   │   ├── page.tsx              # 서버에서 GET /user → 첫 팀으로 redirect, 없으면 안내
│   │   ├── new/page.tsx
│   │   ├── join/page.tsx
│   │   └── [teamId]/
│   │       ├── layout.tsx        # 서버에서 GET /groups/:id → 실패 시 redirect("/teams")
│   │       ├── page.tsx
│   │       ├── edit/page.tsx
│   │       └── lists/[listId]/page.tsx
│   ├── board/
│   │   ├── layout.tsx            # 기존 app/dashboard/layout.tsx (배경색)
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [articleId]/page.tsx
│   ├── account/page.tsx
│   └── history/page.tsx
└── api/auth/refresh/route.ts     # 체크리스트 Phase 0 버그 수정분
```

모든 `page.tsx`는 `@/views/*`를 re-export만 합니다 (ADR-001).

### 3. 경로 상수

```ts
// src/shared/config/routes.ts
export const ROUTES = {
  home: "/",
  login: "/login",
  kakaoCallback: "/login/kakao",
  signup: "/signup",
  resetPassword: "/reset-password",
  teams: "/teams",
  teamNew: "/teams/new",
  teamJoin: "/teams/join",
  team: (teamId: number | string) => `/teams/${teamId}`,
  teamEdit: (teamId: number | string) => `/teams/${teamId}/edit`,
  taskList: (teamId: number | string, listId: number | string) => `/teams/${teamId}/lists/${listId}`,
  board: "/board",
  boardNew: "/board/new",
  article: (articleId: number | string) => `/board/${articleId}`,
  account: "/account",
  history: "/history",
} as const;

export const AUTH_ONLY_PREFIXES = [ROUTES.login, ROUTES.signup, ROUTES.resetPassword];
export const PROTECTED_PREFIXES = [ROUTES.teams, ROUTES.board, ROUTES.account, ROUTES.history];
```

`href`, `router.push`, `router.replace`, middleware에서는 모두 이 상수를 씁니다.

### 4. middleware 역할 축소

middleware는 **쿠키 존재 여부로 리다이렉트하는 일만** 합니다. 팀 존재 확인과 첫 팀 리다이렉트처럼 API를 호출하는 로직은 서버 컴포넌트(`teams/page.tsx`, `teams/[teamId]/layout.tsx`)로 옮깁니다. 이렇게 하면 페이지 이동이나 prefetch마다 생기던 백엔드 호출 1회가 없어집니다.

> ⚠️ 주의: 현재 middleware를 그대로 두고 URL만 바꾸면 `/teams/new`, `/teams/join`이 `/teams/:id` 존재 확인(`GET /groups/new`)에 걸려 `/teams`로 튕깁니다. 팀 존재 확인 로직은 반드시 `[teamId]/layout.tsx`로 옮겨야 합니다.

### 5. 구 URL 호환

```ts
// next.config.ts
async redirects() {
  return [
    { source: "/team", destination: "/teams", permanent: false },
    { source: "/team-creation", destination: "/teams/new", permanent: false },
    { source: "/team-join", destination: "/teams/join", permanent: false },
    { source: "/team/:teamId/task-list/:listId", destination: "/teams/:teamId/lists/:listId", permanent: false },
    { source: "/team/:teamId/edit", destination: "/teams/:teamId/edit", permanent: false },
    { source: "/team/:teamId", destination: "/teams/:teamId", permanent: false },
    { source: "/dashboard/write", destination: "/board/new", permanent: false },
    { source: "/dashboard/:id", destination: "/board/:id", permanent: false },
    { source: "/dashboard", destination: "/board", permanent: false },
    { source: "/my-page", destination: "/account", permanent: false },
    { source: "/my-history", destination: "/history", permanent: false },
  ];
}
```

- 처음에는 `permanent: false`로 배포합니다. 문제가 없으면 `true`로 바꿉니다.
- 구 쿼리 `?task-id=`는 한동안 할 일 목록 페이지에서 `?task=`와 함께 읽어서 호환합니다.

## Alternatives Considered

### URL은 그대로 두고 폴더만 정리

- Pros: 외부 링크·북마크 영향 없음, 작업량이 적음
- Cons: `/dashboard`=게시판, `/team-creation` 같은 불일치가 계속 남음
- Rejected: redirects로 호환할 수 있어 URL 변경 비용이 낮음

### 할 일 상세를 Intercepting + Parallel Route로 (`/teams/[teamId]/lists/[listId]/tasks/[taskId]`)

- Pros: 상세가 독립 URL이 되고, 새로고침하면 전체 페이지로 열 수 있음
- Cons: `@modal` 슬롯과 `(.)` 인터셉트 폴더가 생겨 구조가 복잡해짐. 지금의 쿼리 방식으로도 딥링크는 이미 됨
- Rejected (보류): 상세 화면을 단독 페이지로 보여줄 필요가 생기면 다시 검토

### `/login/kakao` → `/oauth/kakao/callback`

- Pros: 의미가 더 명확함
- Cons: 카카오 개발자 콘솔, `.env`, Vercel 환경변수를 동시에 바꿔야 하고, 배포 타이밍이 어긋나면 로그인이 깨짐
- Rejected: 얻는 것에 비해 위험이 큼

### 팀을 `/[teamId]`처럼 최상위 경로로

- Pros: URL이 짧아짐
- Cons: `/login`, `/board` 같은 정적 경로와 같은 단계에서 충돌함
- Rejected

## Consequences

- 하드코딩된 경로 약 50곳을 `ROUTES`로 교체해야 함. 이후 URL을 바꿀 때는 한 파일만 고치면 됨
- middleware가 가벼워지고, 팀 존재 확인은 서버 컴포넌트 렌더링 시점으로 옮겨짐
- `/board`의 검색어와 정렬이 URL에 들어가 새로고침, 공유, 뒤로가기가 됨. `useArticleSearchStore`는 삭제
- `(auth)` layout이 `CenteredCardLayout`을 맡아서 각 페이지의 중복이 줄어듦
- Sidebar는 지금처럼 root layout에 둠. 로그인 화면에서 Sidebar를 숨길지는 별도로 결정
- 구 URL redirect 규칙은 최소 한 릴리스 동안 유지한 뒤 정리

## 구현 메모 (2026-10-05)

- **`?date=`는 바꾸지 않았습니다.** 이 값은 `getTask` API에 그대로 전달됩니다. 날짜 칸을 클릭하면 로컬 자정의 ISO가, 주 이동 버튼을 누르면 현재 시각이 포함된 ISO가 전송됩니다. `yyyy-MM-dd`로 바꾸면 KST에서 서버가 받는 날짜가 하루 어긋날 수 있습니다. 서버의 날짜 해석을 확인한 뒤 진행합니다.
- **게시판 검색은 `router.replace`를 씁니다.** 검색어 입력마다 history가 쌓이지 않게 하기 위해서입니다. 그래서 뒤로가기를 누르면 이전 검색어가 아니라 이전 페이지로 이동합니다. 새로고침과 링크 공유 시에는 검색 상태가 유지됩니다.
- **`(auth)/layout.tsx`는 만들지 않았습니다.** 각 인증 페이지가 이미 `CenteredCardLayout`을 직접 쓰고 있어서, 옮겨도 동작은 같고 diff만 커집니다.
- **동적 세그먼트 이름도 바꿨습니다.** `[taskListId]`는 `[listId]`, `[id]`는 `[articleId]`입니다. `useParams()`를 쓰는 곳은 구조 분해 이름을 맞췄습니다(`const { articleId: id } = useParams()`).
