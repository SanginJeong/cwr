/**
 * 앱 내부 경로. href, router.push/replace, middleware는 모두 이 상수를 사용한다.
 * (docs/decisions/ADR-002-route-restructure.md)
 */
type Id = number | string;

export const ROUTES = {
  home: "/",
  login: "/login",
  /** Supabase 인증 콜백 (비밀번호 재설정 메일). app/auth/callback/route.ts */
  authCallback: "/auth/callback",
  resetPassword: "/reset-password",
  /** 내 근태. 로그인 후 첫 화면 (roadmap H3) */
  attendance: "/attendance",
  /** 휴가 승인. 팀장·인사담당자 (roadmap H4) */
  approvals: "/approvals",
  teams: "/teams",
  /** 인사담당자만 (ADR-006) */
  teamNew: "/teams/new",
  team: (teamId: Id) => `/teams/${teamId}`,
  teamEdit: (teamId: Id) => `/teams/${teamId}/edit`,
  taskList: (teamId: Id, listId: Id) => `/teams/${teamId}/lists/${listId}`,
  board: "/board",
  boardNew: "/board/new",
  article: (articleId: Id) => `/board/${articleId}`,
  account: "/account",
  history: "/history",
} as const;

/** 로그인 상태에서 접근하면 홈으로 보내는 경로 */
export const AUTH_ONLY_ROUTES: string[] = [ROUTES.login, ROUTES.resetPassword];

/** 비로그인 상태에서 접근하면 로그인으로 보내는 경로 (prefix 매칭) */
export const PROTECTED_ROUTES: string[] = [
  ROUTES.attendance,
  ROUTES.approvals,
  ROUTES.account,
  ROUTES.history,
  ROUTES.teams,
  ROUTES.board,
];
