import instance from "@/shared/api/instance";
import { GetTaskRequest, TaskResponse } from "@/shared/api/types/taskApi";
import { getTasksWithSupabase } from "./task.supabase";
import { isSupabase } from "@/shared/config/backend";

const getTask = async ({ groupId, taskListId, date }: GetTaskRequest): Promise<TaskResponse> => {
  if (isSupabase) return getTasksWithSupabase(taskListId, date);

  const response = await instance.get<TaskResponse>(`/groups/${groupId}/task-lists/${taskListId}/tasks`, {
    params: date ? { date } : undefined,
  });

  const data = response.data.reverse();
  return data || [];
};

export default getTask;
