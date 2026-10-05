import instance from "@/shared/api/instance";
import { CreateTeamRequest, CreateTeamResponse } from "@/shared/api/types/teamCreationApi";
import { createTeamWithSupabase } from "./postCreateTeam.supabase";
import { isSupabase } from "@/shared/config/backend";

const postCreateTeam = async ({ name, image }: CreateTeamRequest): Promise<CreateTeamResponse> => {
  if (isSupabase) return createTeamWithSupabase({ name, image });

  const response = await instance.post<CreateTeamResponse>(`/groups`, {
    name,
    image,
  });
  return response.data;
};

export default postCreateTeam;
