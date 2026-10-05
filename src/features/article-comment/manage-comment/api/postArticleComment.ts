import instance from "@/shared/api/instance";
import { PostArticleCommentsRequest, PostArticleCommentsResponse } from "@/shared/api/types/articleCommentApi";
import { postArticleCommentWithSupabase } from "./articleComment.supabase";
import { isSupabase } from "@/shared/config/backend";

const postArticleComment = async ({ articleId, body }: PostArticleCommentsRequest) => {
  if (isSupabase) return postArticleCommentWithSupabase(articleId, body.content);

  const { data } = await instance.post<PostArticleCommentsResponse>(`/articles/${articleId}/comments`, body);
  return data;
};

export default postArticleComment;
