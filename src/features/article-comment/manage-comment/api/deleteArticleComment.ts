import instance from "@/shared/api/instance";
import { DeleteArticleCommentRequest } from "@/shared/api/types/articleCommentApi";

const deleteArticleComment = async ({ commentId }: DeleteArticleCommentRequest) => {
  const { data } = await instance.delete(`/comments/${commentId}`);
  return data;
};

export default deleteArticleComment;
