import { PostArticleLikeRequest } from "@/shared/api/types/articleApi";
import { likeArticleWithSupabase } from "./articleLike.supabase";

const postArticleLike = async ({ articleId }: PostArticleLikeRequest) => {
  return likeArticleWithSupabase(articleId);
};

export default postArticleLike;
