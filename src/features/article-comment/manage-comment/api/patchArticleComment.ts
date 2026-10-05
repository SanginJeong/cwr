import instance from "@/shared/api/instance";
import { PatchArticleCommentRequest, PatchArticleCommentResponse } from "@/shared/api/types/articleCommentApi";

const patchArticleComment = async ({ commentId, body }: PatchArticleCommentRequest) => {
  const { data } = await instance.patch<PatchArticleCommentResponse>(`/comments/${commentId}`, body);
  return data;
};

export default patchArticleComment;
