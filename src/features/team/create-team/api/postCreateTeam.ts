import instance from "@/shared/api/instance";
import { CreateTeamRequest, CreateTeamResponse } from "@/shared/api/types/teamCreationApi";

const postCreateTeam = async ({ name, image }: CreateTeamRequest): Promise<CreateTeamResponse> => {
  const response = await instance.post<CreateTeamResponse>(`/groups`, {
    name,
    image,
  });
  return response.data;
};

export default postCreateTeam;
