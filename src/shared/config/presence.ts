/**
 * 접속 상태 (supabase/migrations/20261006000002_presence.sql)
 *   online : 활동 중 (10분 동안 입력이 없으면 자리 비움으로 보인다)
 *   away   : 자리 비움
 *   offline: 오프라인. 접속하지 않았거나, 접속해 있어도 "오프라인으로 표시"를 고른 경우
 */
export type PresenceStatus = "online" | "away" | "offline";

export const PRESENCE_STATUSES: PresenceStatus[] = ["online", "away", "offline"];

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: "활동 중",
  away: "자리 비움",
  offline: "오프라인",
};

/** 상태를 고를 때의 문구. 오프라인은 "접속해 있어도 오프라인으로 보이게" 한다 */
export const PRESENCE_CHOICE_LABEL: Record<PresenceStatus, string> = {
  online: "활동 중",
  away: "자리 비움",
  offline: "오프라인으로 표시",
};

export const PRESENCE_DOT_CLASS: Record<PresenceStatus, string> = {
  online: "bg-presence-online",
  away: "bg-presence-away",
  offline: "bg-presence-offline",
};

/** 입력이 없을 때 자리 비움으로 바꾸기까지 */
export const PRESENCE_IDLE_MS = 10 * 60 * 1000;
