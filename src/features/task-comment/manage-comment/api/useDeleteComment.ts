import deleteComment from "./deleteComment";
import { DeleteTaskListCommentRequest } from "@/shared/api/types/taskCommentApi";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteComment = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, commentId }: DeleteTaskListCommentRequest) => deleteComment({ taskId, commentId }),

    onSuccess: (_data, variables) => {
      if (!variables) return;
      const { taskId } = variables;

      success("댓글 삭제 성공");
      queryClient.invalidateQueries({
        queryKey: ["task-list-comment", taskId],
      });
      // 댓글 수를 보여주는 상세와 목록 카드도 (등록과 같다)
      queryClient.invalidateQueries({ queryKey: ["task-list-detail"] });
      queryClient.invalidateQueries({ queryKey: ["task-list"] });
    },

    onError: () => {
      error("댓글 삭제 실패");
    },
  });
};

export default useDeleteComment;
