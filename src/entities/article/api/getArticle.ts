import instance from "@/shared/api/instance";
import { GetArticleRequest, GetArticleResponse } from "@/shared/api/types/articleApi";
import { getArticleWithSupabase } from "./article.supabase";
import { isSupabase } from "@/shared/config/backend";

const getArticle = async ({ articleId }: GetArticleRequest) => {
  if (isSupabase) return getArticleWithSupabase(articleId);

  const { data } = await instance.get<GetArticleResponse>(`/articles/${articleId}`);
  return data;
};

export default getArticle;
