import postArticleComment from "./postArticleComment";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const usePostArticleComment = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postArticleComment,
    onSuccess: () => {
      success("댓글을 성공적으로 등록하였습니다.");
      queryClient.invalidateQueries({ queryKey: ["articleComments"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
      // 목록(["articles"])도 제목·좋아요·댓글 수를 보여준다. 예전에는 상세만 무효화해 목록이 staleTime(5분) 동안 예전 값이었다
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: () => {
      error("댓글 등록을 실패하였습니다.");
    },
  });
};

export default usePostArticleComment;
