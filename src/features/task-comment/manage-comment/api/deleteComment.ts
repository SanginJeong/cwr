import { DeleteTaskListCommentRequest } from "@/shared/api/types/taskCommentApi";
import { deleteCommentWithSupabase } from "./comment.supabase";

const deleteComment = async ({ commentId }: DeleteTaskListCommentRequest) => {
  return deleteCommentWithSupabase(commentId);
};

export default deleteComment;
