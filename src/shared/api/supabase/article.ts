import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError, toApiError } from "@/shared/api/supabase/errors";
import type { ArticleDetail } from "@/shared/api/types/ArticleType";
import type { ArticleCommentType } from "@/shared/api/types/ArticleCommentType";
import type { ViewRow } from "./types";

/**
 * 게시판 뷰(article_view, article_comment_view) 행 → 기존 타입.
 * 여러 슬라이스(entities/article, features/article, features/article-comment)가 같이 쓴다.
 */

/** 비로그인이면 is_liked가 null */
export type ArticleRow = ViewRow<"article_view", "image" | "writer_image" | "is_liked">;
export type ArticleCommentRow = ViewRow<"article_comment_view", "writer_image">;

export const mapArticle = (row: ArticleRow): ArticleDetail => ({
  id: row.id,
  title: row.title,
  content: row.content,
  image: row.image ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  writer: { id: row.writer_id, nickname: row.writer_nickname },
  likeCount: Number(row.like_count),
  commentCount: Number(row.comment_count),
  isLiked: row.is_liked ?? false,
});

export const mapArticleComment = (row: ArticleCommentRow): ArticleCommentType => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  writer: { id: row.writer_id, nickname: row.writer_nickname, image: row.writer_image ?? "" },
});

export const fetchArticle = async (articleId: number): Promise<ArticleDetail> => {
  const { data, error } = await getSupabase().from("article_view").select().eq("id", articleId).maybeSingle();
  if (error) throw toApiError(error, "게시글을 불러오지 못했습니다.");
  if (!data) throw new ApiError("게시글을 찾을 수 없습니다.", 404);
  return mapArticle(data as ArticleRow);
};

export const fetchArticleComment = async (commentId: number): Promise<ArticleCommentType> => {
  const { data, error } = await getSupabase().from("article_comment_view").select().eq("id", commentId).single();
  if (error) throw toApiError(error, "댓글을 불러오지 못했습니다.");
  return mapArticleComment(data as ArticleCommentRow);
};
