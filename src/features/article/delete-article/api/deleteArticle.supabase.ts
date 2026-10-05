import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { DeleteArticleResponse } from "@/shared/api/types/articleApi";

const deleteArticleWithSupabase = async (articleId: number): Promise<DeleteArticleResponse> => {
  const { data, error } = await getSupabase().from("articles").delete().eq("id", articleId).select("id");
  if (error) throw toApiError(error, "게시글을 삭제하지 못했습니다.");
  assertAffected(data, "게시글 작성자만 삭제할 수 있습니다.");
  return { id: articleId };
};

export default deleteArticleWithSupabase;
