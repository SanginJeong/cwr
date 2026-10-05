import instance from "@/shared/api/instance";
import { PatchArticleRequest, PatchArticleResponse } from "@/shared/api/types/articleApi";

const patchArticle = async ({ articleId, body }: PatchArticleRequest) => {
  const { data } = await instance.patch<PatchArticleResponse>(`/articles/${articleId}`, body);
  return data;
};

export default patchArticle;
