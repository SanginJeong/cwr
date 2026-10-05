import deleteArticleComment from "@/api/axios/articleComment/deleteArticleComment";
import { toastKit } from "@/utils/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteArticleComment = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: deleteArticleComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articleComments"] });
      queryClient.invalidateQueries({ queryKey: ["article"] });
      success("댓글을 성공적으로 삭제하였습니다.");
    },
    onError: () => {
      error("댓글을 삭제하지 못했습니다.");
    },
  });
};

export default useDeleteArticleComment;
