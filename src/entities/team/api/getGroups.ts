import { GetGroupsRequest, GetGroupsResponse } from "@/shared/api/types/groupApi";
import { getGroupWithSupabase } from "./team.supabase";

const getGroups = async ({ id }: GetGroupsRequest): Promise<GetGroupsResponse> => {
  return getGroupWithSupabase(id);
};

export default getGroups;
