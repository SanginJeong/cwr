import { DeleteArticleLikeRequest } from "@/shared/api/types/articleApi";
import { unlikeArticleWithSupabase } from "./articleLike.supabase";

const deleteArticleLike = async ({ articleId }: DeleteArticleLikeRequest) => {
  return unlikeArticleWithSupabase(articleId);
};

export default deleteArticleLike;
