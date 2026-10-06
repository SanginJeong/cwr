import instance from "@/shared/api/instance";
import { PatchGroupRequest, PatchGroupResponse } from "@/shared/api/types/groupApi";
import { patchGroupWithSupabase } from "./patchGroup.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchGroup = async ({ param, body }: PatchGroupRequest): Promise<PatchGroupResponse> => {
  if (isSupabase) return patchGroupWithSupabase({ param, body });

  const { data } = await instance.patch(`/groups/${param.id}`, body);
  return data;
};

export default patchGroup;
