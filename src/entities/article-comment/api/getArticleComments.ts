import instance from "@/shared/api/instance";
import { GetArticleCommentsRequest, GetArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";
import getArticleCommentsWithSupabase from "./getArticleComments.supabase";
import { isSupabase } from "@/shared/config/backend";

const getArticleComments = async ({ articleId, limit = 10, cursor }: GetArticleCommentsRequest) => {
  if (isSupabase) return getArticleCommentsWithSupabase({ articleId, limit, cursor });

  const { data } = await instance.get<GetArticleCommentsResponse>(`/articles/${articleId}/comments`, {
    params: { limit, cursor },
  });
  return data;
};

export default getArticleComments;
