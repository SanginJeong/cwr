import { PatchTaskDetailRequest, PatchTaskDetailResponse } from "@/shared/api/types/taskApi";
import { patchTaskWithSupabase } from "./task.supabase";

const patchTaskDetail = async ({
  taskId,
  body: { name, description, done },
}: PatchTaskDetailRequest): Promise<PatchTaskDetailResponse> => {
  return patchTaskWithSupabase(taskId, { name, description, done });
};

export default patchTaskDetail;
