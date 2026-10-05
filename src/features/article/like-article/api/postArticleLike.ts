import instance from "@/shared/api/instance";
import { PostArticleLikeRequest, PostArticleLikeResponse } from "@/shared/api/types/articleApi";
import { likeArticleWithSupabase } from "./articleLike.supabase";
import { isSupabase } from "@/shared/config/backend";

const postArticleLike = async ({ articleId }: PostArticleLikeRequest) => {
  if (isSupabase) return likeArticleWithSupabase(articleId);

  const { data } = await instance.post<PostArticleLikeResponse>(`/articles/${articleId}/like`);
  return data;
};

export default postArticleLike;
