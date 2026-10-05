import instance from "@/shared/api/instance";
import { GetArticlesRequest, GetArticlesResponse } from "@/shared/api/types/articleApi";

const getArticles = async (params: GetArticlesRequest): Promise<GetArticlesResponse> => {
  const { data } = await instance.get<GetArticlesResponse>("/articles", { params });
  return data;
};

export default getArticles;
