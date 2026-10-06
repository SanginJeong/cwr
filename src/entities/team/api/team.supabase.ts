import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapGroupDetail } from "@/shared/api/supabase/mappers/group";
import { rpcJson } from "@/shared/api/supabase/types";
import { GetGroupsResponse, TeamSummary } from "@/shared/api/types/groupApi";

export const getGroupWithSupabase = async (id: number): Promise<GetGroupsResponse> => {
  const { data, error } = await getSupabase().rpc("get_group", { p_group_id: id });
  if (error) throw toApiError(error, "팀 정보를 불러오지 못했습니다.");
  return mapGroupDetail(rpcJson("get_group", data));
};

/** 내가 볼 수 있는 팀 전체. 인사담당자는 회사의 모든 팀, 그 외에는 소속 팀 (RLS) */
export const getVisibleTeamsWithSupabase = async (): Promise<TeamSummary[]> => {
  const { data, error } = await getSupabase().from("groups").select("id, name").order("id");
  if (error) throw toApiError(error, "팀 목록을 불러오지 못했습니다.");
  return data;
};
