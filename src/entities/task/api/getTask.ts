import { GetTaskRequest, TaskResponse } from "@/shared/api/types/taskApi";
import { getTasksWithSupabase } from "./task.supabase";

const getTask = async ({ taskListId, date }: GetTaskRequest): Promise<TaskResponse> => {
  return getTasksWithSupabase(taskListId, date);
};

export default getTask;
