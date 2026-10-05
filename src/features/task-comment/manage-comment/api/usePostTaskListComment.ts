import postTaskListComment from "./postTaskListComment";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UsePostTaskListCommentParams {
  groupId: number;
  taskListId: number;
  taskId: number;
}

const usePostTaskListComment = ({ groupId, taskListId, taskId }: UsePostTaskListCommentParams) => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => postTaskListComment({ groupId, taskListId, taskId, content }),

    onSuccess: () => {
      success("댓글 추가 성공");
      queryClient.invalidateQueries({ queryKey: ["task-list", groupId, taskListId, taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-list-comment", taskId] });
    },

    onError: () => {
      error("댓글 추가 실패");
    },
  });
};

export default usePostTaskListComment;
