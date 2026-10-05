import instance from "@/shared/api/instance";
import { DeleteArticleRequest, DeleteArticleResponse } from "@/shared/api/types/articleApi";

const deleteArticle = async ({ articleId }: DeleteArticleRequest) => {
  const { data } = await instance.delete<DeleteArticleResponse>(`/articles/${articleId}`);
  return data;
};

export default deleteArticle;
