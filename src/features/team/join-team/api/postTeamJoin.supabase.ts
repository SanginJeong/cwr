import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { PostTeamJoinRequest, PostTeamJoinResponse } from "@/shared/api/types/teamJoinApi";

/** 기존 API는 userEmail을 받았지만, Supabase는 로그인한 본인만 들어간다 (behavior-spec §4.3) */
export const joinTeamWithSupabase = async ({ token }: PostTeamJoinRequest): Promise<PostTeamJoinResponse> => {
  const { data, error } = await getSupabase().rpc("accept_invitation", { p_token: token });
  if (error) throw toApiError(error, "팀에 참여하지 못했습니다.");
  return { groupId: data.groupId };
};
