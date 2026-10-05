import instance from "@/lib/axios";
import { PatchArticleRequest, PatchArticleResponse } from "./_type";

const patchArticle = async ({ articleId, body }: PatchArticleRequest) => {
  const { data } = await instance.patch<PatchArticleResponse>(`/articles/${articleId}`, body);
  return data;
};

export default patchArticle;
