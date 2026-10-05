import instance from "@/shared/api/instance";
import { PatchArticleRequest, PatchArticleResponse } from "@/shared/api/types/articleApi";
import patchArticleWithSupabase from "./patchArticle.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchArticle = async ({ articleId, body }: PatchArticleRequest) => {
  if (isSupabase) return patchArticleWithSupabase({ articleId, body });

  const { data } = await instance.patch<PatchArticleResponse>(`/articles/${articleId}`, body);
  return data;
};

export default patchArticle;
