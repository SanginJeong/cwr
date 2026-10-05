import instance from "@/shared/api/instance";
import { PostArticleLikeRequest, PostArticleLikeResponse } from "@/shared/api/types/articleApi";

const postArticleLike = async ({ articleId }: PostArticleLikeRequest) => {
  const { data } = await instance.post<PostArticleLikeResponse>(`/articles/${articleId}/like`);
  return data;
};

export default postArticleLike;
