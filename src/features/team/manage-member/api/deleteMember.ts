import instance from "@/shared/api/instance";
import { DeleteMemberRequest } from "@/shared/api/types/groupApi";

const deleteMember = async ({ id, memberUserId }: DeleteMemberRequest) => {
  const { data } = await instance.delete(`/groups/${id}/member/${memberUserId}`);
  return data;
};

export default deleteMember;
