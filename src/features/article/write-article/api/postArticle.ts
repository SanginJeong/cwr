import instance from "@/shared/api/instance";
import { PostArticleRequest, PostArticleResponse } from "@/shared/api/types/articleApi";

const postArticle = async (body: PostArticleRequest) => {
  const { data } = await instance.post<PostArticleResponse>("/articles", body);
  return data;
};

export default postArticle;
