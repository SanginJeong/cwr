import instance from "@/shared/api/instance";
import { GetArticleRequest, GetArticleResponse } from "@/shared/api/types/articleApi";

const getArticle = async ({ articleId }: GetArticleRequest) => {
  const { data } = await instance.get<GetArticleResponse>(`/articles/${articleId}`);
  return data;
};

export default getArticle;
