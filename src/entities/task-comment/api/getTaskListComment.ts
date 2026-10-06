import { GetTaskListCommentRequest, GetTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";
import getTaskListCommentWithSupabase from "./getTaskListComment.supabase";

const getTaskListComment = async ({ taskId }: GetTaskListCommentRequest): Promise<GetTaskListCommentResponse[]> => {
  return getTaskListCommentWithSupabase(taskId);
};

export default getTaskListComment;
