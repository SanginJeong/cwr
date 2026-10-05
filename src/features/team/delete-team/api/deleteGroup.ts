import instance from "@/shared/api/instance";
import { DeleteGroupRequest, DeleteGroupResponse } from "@/shared/api/types/groupApi";
import { deleteGroupWithSupabase } from "./deleteGroup.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteGroup = async ({ id }: DeleteGroupRequest): Promise<DeleteGroupResponse> => {
  if (isSupabase) {
    await deleteGroupWithSupabase(id);
    return {};
  }

  const { data } = await instance.delete<DeleteGroupResponse>(`groups/${id}`);
  return data;
};

export default deleteGroup;
