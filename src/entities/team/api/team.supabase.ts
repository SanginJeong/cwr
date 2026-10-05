import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapGroupDetail } from "@/shared/api/supabase/mappers/group";
import { GetGroupsResponse, GetInvitationResponse } from "@/shared/api/types/groupApi";

export const getGroupWithSupabase = async (id: number): Promise<GetGroupsResponse> => {
  const { data, error } = await getSupabase().rpc("get_group", { p_group_id: id });
  if (error) throw toApiError(error, "팀 정보를 불러오지 못했습니다.");
  return mapGroupDetail(data);
};

/** 유효한 토큰이 있으면 같은 토큰을 돌려준다 (ADR-004 §5) */
export const getInvitationWithSupabase = async (id: number): Promise<GetInvitationResponse> => {
  const { data, error } = await getSupabase().rpc("create_invitation", { p_group_id: id });
  if (error) throw toApiError(error, "초대 링크를 만들지 못했습니다.");
  return data as string;
};
