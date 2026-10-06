import { useQuery } from "@tanstack/react-query";
import { getVisibleTeamsWithSupabase } from "./team.supabase";

/**
 * 내가 볼 수 있는 팀 목록. 인사담당자의 사이드바에서 쓴다 (직원·팀장은 get_me의 memberships).
 * 키가 ["groups", ...]라서 팀 생성·수정·삭제 때 ["groups"]를 무효화하면 함께 갱신된다.
 */
const useGetVisibleTeams = ({ enabled = true }: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ["groups", "visible"],
    queryFn: getVisibleTeamsWithSupabase,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

export default useGetVisibleTeams;
