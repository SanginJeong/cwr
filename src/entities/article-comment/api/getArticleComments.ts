import instance from "@/shared/api/instance";
import { GetArticleCommentsRequest, GetArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";

const getArticleComments = async ({ articleId, limit = 10, cursor }: GetArticleCommentsRequest) => {
  const { data } = await instance.get<GetArticleCommentsResponse>(`/articles/${articleId}/comments`, {
    params: { limit, cursor },
  });
  return data;
};

export default getArticleComments;
