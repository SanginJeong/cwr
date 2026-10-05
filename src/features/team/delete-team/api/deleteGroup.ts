import instance from "@/shared/api/instance";
import { DeleteGroupRequest, DeleteGroupResponse } from "@/shared/api/types/groupApi";

const deleteGroup = async ({ id }: DeleteGroupRequest): Promise<DeleteGroupResponse> => {
  const { data } = await instance.delete<DeleteGroupResponse>(`groups/${id}`);
  return data;
};

export default deleteGroup;
