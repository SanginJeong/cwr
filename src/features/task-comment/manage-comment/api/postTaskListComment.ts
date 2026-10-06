import { PostTaskListCommentRequest, PostTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";
import { postCommentWithSupabase } from "./comment.supabase";

const postTaskListComment = async ({
  taskId,
  content,
}: PostTaskListCommentRequest): Promise<PostTaskListCommentResponse> => {
  return postCommentWithSupabase(taskId, content);
};

export default postTaskListComment;
