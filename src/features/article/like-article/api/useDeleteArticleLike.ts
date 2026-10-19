import deleteArticleLike from "./deleteArticleLike";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteArticleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article"] });
      // 목록(["articles"])도 제목·좋아요·댓글 수를 보여준다. 예전에는 상세만 무효화해 목록이 staleTime(5분) 동안 예전 값이었다
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
};

export default useDeleteArticleLike;
