import instance from "@/shared/api/instance";
import { GetTaskDetailRequest, GetTaskDetailResponse } from "@/shared/api/types/taskApi";
import { getTaskDetailWithSupabase } from "./task.supabase";
import { isSupabase } from "@/shared/config/backend";

const getTaskDetail = async ({ groupId, taskListId, taskId }: GetTaskDetailRequest): Promise<GetTaskDetailResponse> => {
  if (isSupabase) return getTaskDetailWithSupabase(taskId);

  const response = await instance.get<GetTaskDetailResponse>(
    `/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
  );

  return response.data || [];
};

export default getTaskDetail;
