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
    },

    onError: () => {
      error("댓글 삭제 실패");
    },
  });
};

export default useDeleteComment;
