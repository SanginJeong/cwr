import instance from "@/shared/api/instance";
import { DeleteArticleRequest, DeleteArticleResponse } from "@/shared/api/types/articleApi";
import deleteArticleWithSupabase from "./deleteArticle.supabase";
import { isSupabase } from "@/shared/config/backend";

const deleteArticle = async ({ articleId }: DeleteArticleRequest) => {
  if (isSupabase) return deleteArticleWithSupabase(articleId);

  const { data } = await instance.delete<DeleteArticleResponse>(`/articles/${articleId}`);
  return data;
};

export default deleteArticle;
