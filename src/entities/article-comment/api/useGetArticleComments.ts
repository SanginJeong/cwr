import getArticleComments from "./getArticleComments";
import { GetArticleCommentsRequest } from "@/shared/api/types/articleCommentApi";
import { useInfiniteQuery } from "@tanstack/react-query";

/**
 * 게시글 댓글 (최신순, 커서 페이지네이션).
 * data.list는 지금까지 불러온 페이지를 이어 붙인 목록. 다음 페이지는 fetchNextPage로.
 */
const useGetArticleComments = ({ articleId, limit = 10 }: Omit<GetArticleCommentsRequest, "cursor">) => {
  return useInfiniteQuery({
    queryKey: ["articleComments", { articleId, limit }],
    queryFn: ({ pageParam }) => getArticleComments({ articleId, limit, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    // 마지막 페이지면 nextCursor가 null (behavior-spec §6)
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({ list: data.pages.flatMap((page) => page.list) }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
};

export default useGetArticleComments;
