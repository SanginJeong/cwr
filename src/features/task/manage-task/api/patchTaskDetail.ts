import instance from "@/shared/api/instance";
import { PatchTaskDetailRequest, PatchTaskDetailResponse } from "@/shared/api/types/taskApi";
import { patchTaskWithSupabase } from "./task.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchTaskDetail = async ({
  groupId,
  taskListId,
  taskId,
  body: { name, description, done },
}: PatchTaskDetailRequest): Promise<PatchTaskDetailResponse> => {
  if (isSupabase) return patchTaskWithSupabase(taskId, { name, description, done });

  const response = await instance.patch<PatchTaskDetailResponse>(
    `/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
    {
      name,
      description,
      done,
    },
  );

  return response.data;
};

export default patchTaskDetail;
