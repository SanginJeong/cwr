import instance from "@/shared/api/instance";
import { DeleteMemberRequest } from "@/shared/api/types/groupApi";
import { deleteMemberWithSupabase } from "./deleteMember.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteMember = async ({ id, memberUserId }: DeleteMemberRequest) => {
  if (isSupabase) return deleteMemberWithSupabase(id, memberUserId);

  const { data } = await instance.delete(`/groups/${id}/member/${memberUserId}`);
  return data;
};

export default deleteMember;
