import instance from "@/shared/api/instance";
import { DeleteTaskRequest } from "@/shared/api/types/taskApi";
import { deleteTaskWithSupabase } from "./task.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteTask = async ({ groupId, taskListId, taskId }: DeleteTaskRequest) => {
  if (isSupabase) return deleteTaskWithSupabase(taskId);

  const response = await instance.delete(`/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`);

  return response.data;
};

export default deleteTask;
