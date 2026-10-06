import { PatchTaskRequest } from "@/shared/api/types/taskApi";
import { renameTaskListWithSupabase } from "./taskList.supabase";

const patchTask = async ({ id, name }: PatchTaskRequest) => {
  return renameTaskListWithSupabase(id, name);
};

export default patchTask;
