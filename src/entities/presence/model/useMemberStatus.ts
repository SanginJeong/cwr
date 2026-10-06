import type { PresenceStatus } from "@/shared/config/presence";
import usePresenceStore, { selectMyStatus } from "./usePresenceStore";

/**
 * 팀 멤버의 접속 상태. 나 자신이면 내가 보내는 상태를 그대로 보여준다.
 */
const useMemberStatus = (groupId: number, userId: number, myUserId?: number): PresenceStatus => {
  const myStatus = usePresenceStore(selectMyStatus);
  const status = usePresenceStore((state) => state.teams[groupId]?.[userId]);

  if (userId === myUserId) return myStatus;
  return status ?? "offline";
};

export default useMemberStatus;
