import instance from "@/shared/api/instance";
import { PatchGroupRequest, PatchGroupResponse } from "@/shared/api/types/groupApi";

const patchGroup = async ({ param, body }: PatchGroupRequest): Promise<PatchGroupResponse> => {
  const { data } = await instance.patch(`/groups/${param.id}`, body);
  return data;
};

export default patchGroup;
