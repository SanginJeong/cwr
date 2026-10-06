import { GetArticlesRequest, GetArticlesResponse } from "@/shared/api/types/articleApi";
import { getArticlesWithSupabase } from "./article.supabase";

const getArticles = async (params: GetArticlesRequest): Promise<GetArticlesResponse> => {
  return getArticlesWithSupabase(params);
};

export default getArticles;
