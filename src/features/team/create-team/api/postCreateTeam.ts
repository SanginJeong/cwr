import { CreateTeamRequest, CreateTeamResponse } from "@/shared/api/types/teamCreationApi";
import { createTeamWithSupabase } from "./postCreateTeam.supabase";

const postCreateTeam = async ({ name, image }: CreateTeamRequest): Promise<CreateTeamResponse> => {
  return createTeamWithSupabase({ name, image });
};

export default postCreateTeam;
