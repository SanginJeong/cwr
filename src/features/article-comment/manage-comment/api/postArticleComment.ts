import instance from "@/shared/api/instance";
import { PostArticleCommentsRequest, PostArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";

const postArticleComment = async ({ articleId, body }: PostArticleCommentsRequest) => {
  const { data } = await instance.post<PostArticleCommentsResponse>(`/articles/${articleId}/comments`, body);
  return data;
};

export default postArticleComment;
