import { GetArticleRequest } from "@/shared/api/types/articleApi";
import { getArticleWithSupabase } from "./article.supabase";

const getArticle = async ({ articleId }: GetArticleRequest) => {
  return getArticleWithSupabase(articleId);
};

export default getArticle;
