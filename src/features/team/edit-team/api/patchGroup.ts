import { PatchGroupRequest, PatchGroupResponse } from "@/shared/api/types/groupApi";
import { patchGroupWithSupabase } from "./patchGroup.supabase";

const patchGroup = async ({ param, body }: PatchGroupRequest): Promise<PatchGroupResponse> => {
  return patchGroupWithSupabase({ param, body });
};

export default patchGroup;
