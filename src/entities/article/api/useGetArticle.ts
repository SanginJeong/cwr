import getArticle from "./getArticle";
import { GetArticleRequest } from "@/shared/api/types/articleApi";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/supabase/errors";

const useGetArticle = ({ articleId }: GetArticleRequest) => {
  return useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle({ articleId }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    // 없는 글(404)은 다시 시도해도 없으므로 바로 안내를 보여준다
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
};

export default useGetArticle;
