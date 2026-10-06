import { GetTaskDetailRequest, GetTaskDetailResponse } from "@/shared/api/types/taskApi";
import { getTaskDetailWithSupabase } from "./task.supabase";

const getTaskDetail = async ({ taskId }: GetTaskDetailRequest): Promise<GetTaskDetailResponse> => {
  return getTaskDetailWithSupabase(taskId);
};

export default getTaskDetail;
