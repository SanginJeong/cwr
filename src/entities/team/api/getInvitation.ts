import instance from "@/shared/api/instance";
import { GetInvitationRequest, GetInvitationResponse } from "@/shared/api/types/groupApi";

const getInvitation = async ({ id }: GetInvitationRequest) => {
  const { data } = await instance.get<GetInvitationResponse>(`/groups/${id}/invitation`);
  return data;
};

export default getInvitation;
