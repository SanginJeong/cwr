import { fetchArticleComment } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { DeleteArticleCommentResponse, PostArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";

// 작성자는 컬럼 기본값으로 정해지고, 수정·삭제는 작성자만 (RLS)

export const postArticleCommentWithSupabase = async (
  articleId: number,
  content: string,
): Promise<PostArticleCommentsResponse> => {
  const { data, error } = await getSupabase()
    .from("article_comments")
    .insert({ article_id: articleId, content })
    .select("id")
    .single();
  if (error) throw toApiError(error, "댓글을 작성하지 못했습니다.");
  return fetchArticleComment(data.id);
};

export const patchArticleCommentWithSupabase = async (
  commentId: number,
  content: string,
): Promise<PostArticleCommentsResponse> => {
  const { data, error } = await getSupabase()
    .from("article_comments")
    .update({ content })
    .eq("id", commentId)
    .select("id");
  if (error) throw toApiError(error, "댓글을 수정하지 못했습니다.");
  assertAffected(data, "댓글 작성자만 수정할 수 있습니다.");
  return fetchArticleComment(commentId);
};

export const deleteArticleCommentWithSupabase = async (commentId: number): Promise<DeleteArticleCommentResponse> => {
  const { data, error } = await getSupabase().from("article_comments").delete().eq("id", commentId).select("id");
  if (error) throw toApiError(error, "댓글을 삭제하지 못했습니다.");
  assertAffected(data, "댓글 작성자만 삭제할 수 있습니다.");
  return { id: commentId };
};
