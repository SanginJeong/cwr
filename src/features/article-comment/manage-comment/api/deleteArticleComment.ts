import { DeleteArticleCommentRequest } from "@/shared/api/types/articleCommentApi";
import { deleteArticleCommentWithSupabase } from "./articleComment.supabase";

const deleteArticleComment = async ({ commentId }: DeleteArticleCommentRequest) => {
  return deleteArticleCommentWithSupabase(commentId);
};

export default deleteArticleComment;
