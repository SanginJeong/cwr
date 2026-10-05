import instance from "@/shared/api/instance";
import { DeleteArticleCommentRequest } from "@/shared/api/types/articleCommentApi";
import { deleteArticleCommentWithSupabase } from "./articleComment.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteArticleComment = async ({ commentId }: DeleteArticleCommentRequest) => {
  if (isSupabase) return deleteArticleCommentWithSupabase(commentId);

  const { data } = await instance.delete(`/comments/${commentId}`);
  return data;
};

export default deleteArticleComment;
