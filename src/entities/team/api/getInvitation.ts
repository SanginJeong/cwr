import { GetInvitationRequest } from "@/shared/api/types/groupApi";
import { getInvitationWithSupabase } from "./team.supabase";

const getInvitation = async ({ id }: GetInvitationRequest) => {
  return getInvitationWithSupabase(id);
};

export default getInvitation;
