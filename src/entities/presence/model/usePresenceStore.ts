import { create } from "zustand";
import type { PresenceStatus } from "@/shared/config/presence";

/**
 * 접속 상태. features/presence/sync가 Realtime Presence로 채운다.
 *
 * - chosen: 내가 고른 상태 (DB의 profiles.presence_status). null이면 아직 불러오지 않음
 * - isIdle: 일정 시간 입력이 없음. chosen이 online이면 다른 사람에게 away로 보인다
 * - teams: 팀별로 지금 접속해 있는 멤버의 상태 (groupId → userId → 상태). 없으면 오프라인
 */
interface PresenceState {
  chosen: PresenceStatus | null;
  isIdle: boolean;
  teams: Record<number, Record<number, PresenceStatus>>;
  setChosen: (status: PresenceStatus) => void;
  setIdle: (isIdle: boolean) => void;
  setTeamMembers: (groupId: number, members: Record<number, PresenceStatus>) => void;
  reset: () => void;
}

const usePresenceStore = create<PresenceState>()((set) => ({
  chosen: null,
  isIdle: false,
  teams: {},
  setChosen: (chosen) => set({ chosen }),
  setIdle: (isIdle) => set({ isIdle }),
  setTeamMembers: (groupId, members) => set((state) => ({ teams: { ...state.teams, [groupId]: members } })),
  reset: () => set({ chosen: null, isIdle: false, teams: {} }),
}));

/** 다른 사람에게 보이는 내 상태 */
export const selectMyStatus = (state: PresenceState): PresenceStatus => {
  const chosen = state.chosen ?? "online";
  return chosen === "online" && state.isIdle ? "away" : chosen;
};

export default usePresenceStore;
