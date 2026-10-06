import { fetchArticle } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { PatchArticleRequest, PatchArticleResponse } from "@/shared/api/types/articleApi";

const patchArticleWithSupabase = async ({ articleId, body }: PatchArticleRequest): Promise<PatchArticleResponse> => {
  const { data, error } = await getSupabase().from("articles").update(body).eq("id", articleId).select("id");
  if (error) throw toApiError(error, "게시글을 수정하지 못했습니다.");
  assertAffected(data, "게시글 작성자만 수정할 수 있습니다.");
  return fetchArticle(articleId);
};

export default patchArticleWithSupabase;
