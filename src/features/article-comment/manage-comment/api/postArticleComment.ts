import { PostArticleCommentsRequest } from "@/shared/api/types/articleCommentApi";
import { postArticleCommentWithSupabase } from "./articleComment.supabase";

const postArticleComment = async ({ articleId, body }: PostArticleCommentsRequest) => {
  return postArticleCommentWithSupabase(articleId, body.content);
};

export default postArticleComment;
