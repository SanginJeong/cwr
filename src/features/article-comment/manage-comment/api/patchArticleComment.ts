import { PatchArticleCommentRequest } from "@/shared/api/types/articleCommentApi";
import { patchArticleCommentWithSupabase } from "./articleComment.supabase";

const patchArticleComment = async ({ commentId, body }: PatchArticleCommentRequest) => {
  return patchArticleCommentWithSupabase(commentId, body.content);
};

export default patchArticleComment;
