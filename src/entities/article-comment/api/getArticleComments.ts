import { GetArticleCommentsRequest } from "@/shared/api/types/articleCommentApi";
import getArticleCommentsWithSupabase from "./getArticleComments.supabase";

const getArticleComments = async ({ articleId, limit = 10, cursor }: GetArticleCommentsRequest) => {
  return getArticleCommentsWithSupabase({ articleId, limit, cursor });
};

export default getArticleComments;
