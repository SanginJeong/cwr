import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { rpcJson } from "@/shared/api/supabase/types";
import { CreateTeamRequest, CreateTeamResponse } from "@/shared/api/types/teamCreationApi";

export const createTeamWithSupabase = async ({ name, image }: CreateTeamRequest): Promise<CreateTeamResponse> => {
  const { data, error } = await getSupabase().rpc("create_group", { p_name: name, p_image: image || undefined });
  if (error) throw toApiError(error, "팀을 만들지 못했습니다.");
  const group = rpcJson("create_group", data);
  return { id: String(group.id), name: group.name, image: group.image ?? "", createdAt: group.createdAt };
};
