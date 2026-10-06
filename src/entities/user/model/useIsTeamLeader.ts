import useGetUser from "../api/useGetUser";
import { useParams } from "next/navigation";

/** 지금 보고 있는 팀(URL의 teamId)에서 내가 팀장인지. 팀장 = memberships.role "ADMIN" (ADR-006) */
const useIsTeamLeader = () => {
  const { teamId } = useParams();
  const { data: userInfo } = useGetUser();

  const currentGroup = userInfo?.memberships.find((group) => group.groupId === Number(teamId));
  return currentGroup?.role === "ADMIN";
};

export default useIsTeamLeader;
