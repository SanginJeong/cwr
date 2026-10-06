import { PatchArticleRequest } from "@/shared/api/types/articleApi";
import patchArticleWithSupabase from "./patchArticle.supabase";

const patchArticle = async ({ articleId, body }: PatchArticleRequest) => {
  return patchArticleWithSupabase({ articleId, body });
};

export default patchArticle;
