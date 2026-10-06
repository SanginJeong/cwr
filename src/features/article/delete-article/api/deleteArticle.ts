import { DeleteArticleRequest } from "@/shared/api/types/articleApi";
import deleteArticleWithSupabase from "./deleteArticle.supabase";

const deleteArticle = async ({ articleId }: DeleteArticleRequest) => {
  return deleteArticleWithSupabase(articleId);
};

export default deleteArticle;
