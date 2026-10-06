import instance from "@/shared/api/instance";
import { GetInvitationRequest, GetInvitationResponse } from "@/shared/api/types/groupApi";
import { getInvitationWithSupabase } from "./team.supabase";
import { isSupabase } from "@/shared/config/backend";

const getInvitation = async ({ id }: GetInvitationRequest) => {
  if (isSupabase) return getInvitationWithSupabase(id);

  const { data } = await instance.get<GetInvitationResponse>(`/groups/${id}/invitation`);
  return data;
};

export default getInvitation;
