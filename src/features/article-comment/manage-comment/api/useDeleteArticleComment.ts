import deleteArticleComment from "./deleteArticleComment";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteArticleComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: deleteArticleComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articleComments"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
      // 목록(["articles"])도 제목·좋아요·댓글 수를 보여준다. 예전에는 상세만 무효화해 목록이 staleTime(5분) 동안 예전 값이었다
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      success("댓글을 성공적으로 삭제하였습니다.");
    },
    onError: () => {
      error("댓글을 삭제하지 못했습니다.");
    },
  });
};

export default useDeleteArticleComment;
