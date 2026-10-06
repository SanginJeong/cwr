import instance from "@/shared/api/instance";
import { PostTaskListCommentRequest, PostTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";
import { postCommentWithSupabase } from "./comment.supabase";
import { isSupabase } from "@/shared/config/backend";

const postTaskListComment = async ({
  taskId,
  content,
}: PostTaskListCommentRequest): Promise<PostTaskListCommentResponse> => {
  if (isSupabase) return postCommentWithSupabase(taskId, content);

  const response = await instance.post<PostTaskListCommentResponse>(`/tasks/${taskId}/comments`, { content });

  return response.data;
};

export default postTaskListComment;
