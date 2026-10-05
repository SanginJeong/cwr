import { fetchArticle } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { PostArticleRequest, PostArticleResponse } from "@/shared/api/types/articleApi";

/** 작성자는 컬럼 기본값(current_profile_id)으로 정해진다 */
const postArticleWithSupabase = async ({ title, content, image }: PostArticleRequest): Promise<PostArticleResponse> => {
  const { data, error } = await getSupabase()
    .from("articles")
    .insert({ title, content, image: image || null })
    .select("id")
    .single();
  if (error) throw toApiError(error, "게시글을 작성하지 못했습니다.");
  return fetchArticle(data.id);
};

export default postArticleWithSupabase;
