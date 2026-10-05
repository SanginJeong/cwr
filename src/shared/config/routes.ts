/**
 * 앱 내부 경로. href, router.push/replace, middleware는 모두 이 상수를 사용한다.
 * (docs/decisions/ADR-002-route-restructure.md)
 */
type Id = number | string;

export const ROUTES = {
  home: "/",
  login: "/login",
  kakaoCallback: "/login/kakao",
  signup: "/signup",
  resetPassword: "/reset-password",
  teams: "/team",
  teamNew: "/team-creation",
  teamJoin: "/team-join",
  team: (teamId: Id) => `/team/${teamId}`,
  teamEdit: (teamId: Id) => `/team/${teamId}/edit`,
  taskList: (teamId: Id, listId: Id) => `/team/${teamId}/task-list/${listId}`,
  board: "/dashboard",
  boardNew: "/dashboard/write",
  article: (articleId: Id) => `/dashboard/${articleId}`,
  account: "/my-page",
  history: "/my-history",
} as const;

/** 로그인 상태에서 접근하면 홈으로 보내는 경로 */
export const AUTH_ONLY_ROUTES: string[] = [ROUTES.login, ROUTES.signup, ROUTES.resetPassword];

/** 비로그인 상태에서 접근하면 로그인으로 보내는 경로 (prefix 매칭) */
export const PROTECTED_ROUTES: string[] = [ROUTES.account, ROUTES.history, ROUTES.teams, ROUTES.board];
