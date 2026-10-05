import getArticleComments from "@/entities/article-comment/api/getArticleComments";
import { GetArticleCommentsRequest } from "@/shared/api/types/articleCommentApi";
import { useQuery } from "@tanstack/react-query";

const useGetArticleComments = (params: GetArticleCommentsRequest) => {
  return useQuery({
    queryKey: ["articleComments", params],
    queryFn: () => getArticleComments(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
};

export default useGetArticleComments;
