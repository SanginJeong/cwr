import instance from "@/shared/api/instance";
import { GetGroupsRequest, GetGroupsResponse } from "@/shared/api/types/groupApi";
import { getGroupWithSupabase } from "./team.supabase";
import { isSupabase } from "@/shared/config/backend";

const getGroups = async ({ id }: GetGroupsRequest): Promise<GetGroupsResponse> => {
  if (isSupabase) return getGroupWithSupabase(id);

  const { data } = await instance.get<GetGroupsResponse>(`/groups/${id}`);
  return data;
};

export default getGroups;
