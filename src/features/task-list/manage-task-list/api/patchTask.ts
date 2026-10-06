import instance from "@/shared/api/instance";
import { PatchTaskRequest } from "@/shared/api/types/taskApi";
import { renameTaskListWithSupabase } from "./taskList.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchTask = async ({ groupId, id, name }: PatchTaskRequest) => {
  if (isSupabase) return renameTaskListWithSupabase(id, name);

  const response = await instance.patch(`/groups/${groupId}/task-lists/${id}`, { name });

  return response.data;
};

export default patchTask;
