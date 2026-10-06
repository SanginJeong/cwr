import instance from "@/shared/api/instance";
import { GetArticlesRequest, GetArticlesResponse } from "@/shared/api/types/articleApi";
import { getArticlesWithSupabase } from "./article.supabase";
import { isSupabase } from "@/shared/config/backend";

const getArticles = async (params: GetArticlesRequest): Promise<GetArticlesResponse> => {
  if (isSupabase) return getArticlesWithSupabase(params);

  const { data } = await instance.get<GetArticlesResponse>("/articles", { params });
  return data;
};

export default getArticles;
