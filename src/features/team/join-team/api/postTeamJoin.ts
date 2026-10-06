import { PostTeamJoinRequest, PostTeamJoinResponse } from "@/shared/api/types/teamJoinApi";
import { joinTeamWithSupabase } from "./postTeamJoin.supabase";

const postTeamJoin = async (request: PostTeamJoinRequest): Promise<PostTeamJoinResponse> => {
  return joinTeamWithSupabase(request);
};

export default postTeamJoin;
