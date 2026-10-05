import { ArticleCommentRow, mapArticleComment } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { GetArticleCommentsRequest, GetArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";

/**
 * 최신순 커서 페이지네이션. nextCursor는 이번 페이지 마지막 댓글의 id, 마지막 페이지면 null (behavior-spec §6).
 * 마지막 페이지인지 알려고 하나 더 읽는다.
 */
const getArticleCommentsWithSupabase = async ({
  articleId,
  limit = 10,
  cursor,
}: GetArticleCommentsRequest): Promise<GetArticleCommentsResponse> => {
  let query = getSupabase()
    .from("article_comment_view")
    .select()
    .eq("article_id", articleId)
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) throw toApiError(error, "댓글을 불러오지 못했습니다.");

  const list = (data as ArticleCommentRow[]).slice(0, limit).map(mapArticleComment);
  const hasMore = data.length > limit;
  // 기존 타입이 number라서 마지막 페이지의 null을 그대로 넘긴다 (기존 API도 null을 줬다)
  return { list, nextCursor: (hasMore ? list[list.length - 1].id : null) as number };
};

export default getArticleCommentsWithSupabase;
