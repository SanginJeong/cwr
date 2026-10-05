import instance from "@/shared/api/instance";
import { PostTeamJoinRequest, PostTeamJoinResponse } from "@/shared/api/types/teamJoinApi";

const postTeamJoin = async (request: PostTeamJoinRequest): Promise<PostTeamJoinResponse> => {
  const { data } = await instance.post<PostTeamJoinResponse>(`/groups/accept-invitation`, request);
  return data;
};

export default postTeamJoin;
