import { DeleteMemberRequest } from "@/shared/api/types/groupApi";
import { deleteMemberWithSupabase } from "./deleteMember.supabase";

const deleteMember = async ({ id, memberUserId }: DeleteMemberRequest) => {
  return deleteMemberWithSupabase(id, memberUserId);
};

export default deleteMember;
