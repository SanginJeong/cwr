import instance from "@/shared/api/instance";
import { PostTaskListRequest, PostTaskListResponse } from "@/shared/api/types/taskListApi";
import { postTaskListWithSupabase } from "./taskList.supabase";
import { isSupabase } from "@/shared/config/backend";

const postTaskList = async ({ groupId, name }: PostTaskListRequest): Promise<PostTaskListResponse> => {
  if (isSupabase) return postTaskListWithSupabase({ groupId, name });

  const response = await instance.post<PostTaskListResponse>(`/groups/${groupId}/task-lists`, { name });

  return response.data;
};

export default postTaskList;
