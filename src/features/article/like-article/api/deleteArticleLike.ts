import instance from "@/shared/api/instance";
import { DeleteArticleLikeRequest, DeleteArticleLikeResponse } from "@/shared/api/types/articleApi";

const deleteArticleLike = async ({ articleId }: DeleteArticleLikeRequest) => {
  const { data } = await instance.delete<DeleteArticleLikeResponse>(`/articles/${articleId}/like`);
  return data;
};

export default deleteArticleLike;
