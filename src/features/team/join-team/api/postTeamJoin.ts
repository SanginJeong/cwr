import instance from "@/shared/api/instance";
import { PostTeamJoinRequest, PostTeamJoinResponse } from "@/shared/api/types/teamJoinApi";
import { joinTeamWithSupabase } from "./postTeamJoin.supabase";
import { isSupabase } from "@/shared/config/backend";

const postTeamJoin = async (request: PostTeamJoinRequest): Promise<PostTeamJoinResponse> => {
  if (isSupabase) return joinTeamWithSupabase(request);

  const { data } = await instance.post<PostTeamJoinResponse>(`/groups/accept-invitation`, request);
  return data;
};

export default postTeamJoin;
