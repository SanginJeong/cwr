import instance from "@/shared/api/instance";
import { DeleteArticleLikeRequest, DeleteArticleLikeResponse } from "@/shared/api/types/articleApi";
import { unlikeArticleWithSupabase } from "./articleLike.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteArticleLike = async ({ articleId }: DeleteArticleLikeRequest) => {
  if (isSupabase) return unlikeArticleWithSupabase(articleId);

  const { data } = await instance.delete<DeleteArticleLikeResponse>(`/articles/${articleId}/like`);
  return data;
};

export default deleteArticleLike;
