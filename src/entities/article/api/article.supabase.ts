import { ArticleRow, fetchArticle, mapArticle } from "@/shared/api/supabase/article";
import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { GetArticleResponse, GetArticlesRequest, GetArticlesResponse } from "@/shared/api/types/articleApi";

/** PostgREST or() 필터 값. 쉼표·괄호가 들어간 검색어도 안전하게 큰따옴표로 감싼다 */
const quote = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** keyword는 제목과 내용 모두 검색한다 (behavior-spec §6) */
export const getArticlesWithSupabase = async ({
  page = 1,
  pageSize = 10,
  orderBy = "recent",
  keyword,
}: GetArticlesRequest): Promise<GetArticlesResponse> => {
  let query = getSupabase().from("article_view").select("*", { count: "exact" });

  const trimmed = keyword?.trim();
  if (trimmed) {
    const pattern = quote(`%${trimmed}%`);
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }
  if (orderBy === "like") query = query.order("like_count", { ascending: false });
  query = query.order("created_at", { ascending: false }).order("id", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw toApiError(error, "게시글을 불러오지 못했습니다.");
  return { totalCount: count ?? 0, list: (data as ArticleRow[]).map(mapArticle) };
};

export const getArticleWithSupabase = (articleId: number): Promise<GetArticleResponse> => fetchArticle(articleId);
