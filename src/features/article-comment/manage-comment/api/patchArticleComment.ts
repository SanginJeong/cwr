import instance from "@/shared/api/instance";
import { PatchArticleCommentRequest, PatchArticleCommentResponse } from "@/shared/api/types/articleCommentApi";
import { patchArticleCommentWithSupabase } from "./articleComment.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchArticleComment = async ({ commentId, body }: PatchArticleCommentRequest) => {
  if (isSupabase) return patchArticleCommentWithSupabase(commentId, body.content);

  const { data } = await instance.patch<PatchArticleCommentResponse>(`/comments/${commentId}`, body);
  return data;
};

export default patchArticleComment;
