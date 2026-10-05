import instance from "@/shared/api/instance";
import { DeleteTaskListCommentRequest } from "@/shared/api/types/taskCommentApi";
import { deleteCommentWithSupabase } from "./comment.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteComment = async ({ taskId, commentId }: DeleteTaskListCommentRequest) => {
  if (isSupabase) return deleteCommentWithSupabase(commentId);

  const response = await instance.delete(`/tasks/${taskId}/comments/${commentId}`);

  return response.data;
};

export default deleteComment;
