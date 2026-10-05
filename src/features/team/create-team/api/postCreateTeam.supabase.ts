import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { CreateTeamRequest, CreateTeamResponse } from "@/shared/api/types/teamCreationApi";

export const createTeamWithSupabase = async ({ name, image }: CreateTeamRequest): Promise<CreateTeamResponse> => {
  const { data, error } = await getSupabase().rpc("create_group", { p_name: name, p_image: image || null });
  if (error) throw toApiError(error, "팀을 만들지 못했습니다.");
  return { id: String(data.id), name: data.name, image: data.image ?? "", createdAt: data.createdAt };
};
