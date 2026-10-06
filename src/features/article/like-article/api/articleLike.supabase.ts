import { fetchArticle } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError, toApiError } from "@/shared/api/supabase/errors";
import { PostArticleLikeResponse } from "@/shared/api/types/articleApi";

// 응답은 기존 API처럼 갱신된 게시글 상세 (behavior-spec §6)

export const likeArticleWithSupabase = async (articleId: number): Promise<PostArticleLikeResponse> => {
  const { error } = await getSupabase().from("article_likes").insert({ article_id: articleId });
  if (error?.code === "23505") throw new ApiError("이미 좋아요한 게시글입니다.", 400);
  if (error) throw toApiError(error, "좋아요하지 못했습니다.");
  return fetchArticle(articleId);
};

export const unlikeArticleWithSupabase = async (articleId: number): Promise<PostArticleLikeResponse> => {
  // RLS가 본인 좋아요만 지우게 한다
  const { data, error } = await getSupabase()
    .from("article_likes")
    .delete()
    .eq("article_id", articleId)
    .select("article_id");
  if (error) throw toApiError(error, "좋아요를 취소하지 못했습니다.");
  if (!data.length) throw new ApiError("좋아요를 하지 않은 게시글입니다.", 400);
  return fetchArticle(articleId);
};
