import { isSupabase } from "@/shared/config/backend";
import type { PresenceStatus } from "@/shared/config/presence";
import usePresenceStore, { selectMyStatus } from "./usePresenceStore";

/**
 * 팀 멤버의 접속 상태. 나 자신이면 내가 보내는 상태를 그대로 보여준다.
 * 기존 API 모드에는 실시간 기능이 없어서 undefined (상태 점을 그리지 않는다).
 */
const useMemberStatus = (groupId: number, userId: number, myUserId?: number): PresenceStatus | undefined => {
  const myStatus = usePresenceStore(selectMyStatus);
  const status = usePresenceStore((state) => state.teams[groupId]?.[userId]);

  if (!isSupabase) return undefined;
  if (userId === myUserId) return myStatus;
  return status ?? "offline";
};

export default useMemberStatus;
