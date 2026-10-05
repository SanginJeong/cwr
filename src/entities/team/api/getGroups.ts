import instance from "@/shared/api/instance";
import { GetGroupsRequest, GetGroupsResponse } from "@/shared/api/types/groupApi";

const getGroups = async ({ id }: GetGroupsRequest): Promise<GetGroupsResponse> => {
  const { data } = await instance.get<GetGroupsResponse>(`/groups/${id}`);
  return data;
};

export default getGroups;
