import { PostArticleRequest } from "@/shared/api/types/articleApi";
import postArticleWithSupabase from "./postArticle.supabase";

const postArticle = async (body: PostArticleRequest) => {
  return postArticleWithSupabase(body);
};

export default postArticle;
