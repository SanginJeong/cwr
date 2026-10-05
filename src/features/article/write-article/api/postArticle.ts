import instance from "@/shared/api/instance";
import { PostArticleRequest, PostArticleResponse } from "@/shared/api/types/articleApi";
import postArticleWithSupabase from "./postArticle.supabase";
import { isSupabase } from "@/shared/config/backend";

const postArticle = async (body: PostArticleRequest) => {
  if (isSupabase) return postArticleWithSupabase(body);

  const { data } = await instance.post<PostArticleResponse>("/articles", body);
  return data;
};

export default postArticle;
