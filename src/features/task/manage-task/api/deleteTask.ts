import { DeleteTaskRequest } from "@/shared/api/types/taskApi";
import { deleteTaskWithSupabase } from "./task.supabase";

const deleteTask = async ({ taskId }: DeleteTaskRequest) => {
  return deleteTaskWithSupabase(taskId);
};

export default deleteTask;
