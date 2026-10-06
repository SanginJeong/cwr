import { DeleteGroupRequest, DeleteGroupResponse } from "@/shared/api/types/groupApi";
import { deleteGroupWithSupabase } from "./deleteGroup.supabase";

const deleteGroup = async ({ id }: DeleteGroupRequest): Promise<DeleteGroupResponse> => {
  await deleteGroupWithSupabase(id);
  return {};
};

export default deleteGroup;
