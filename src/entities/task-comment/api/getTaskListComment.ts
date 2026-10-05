import instance from "@/shared/api/instance";
import { GetTaskListCommentRequest, GetTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";
import getTaskListCommentWithSupabase from "./getTaskListComment.supabase";
import { isSupabase } from "@/shared/config/backend";

const getTaskListComment = async ({ taskId }: GetTaskListCommentRequest): Promise<GetTaskListCommentResponse[]> => {
  if (isSupabase) return getTaskListCommentWithSupabase(taskId);

  const response = await instance.get<GetTaskListCommentResponse[]>(`/tasks/${taskId}/comments`);
  const reversedData = response.data.reverse();

  return reversedData || [];
};

export default getTaskListComment;
