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
      // 댓글 수는 상세(["task-list-detail", …])와 목록 카드(["task-list", 팀, 목록, 날짜])가 보여준다.
      // 예전에는 어느 쪽과도 맞지 않는 키(["task-list", 팀, 목록, 할 일])를 무효화해 "댓글 0"이 그대로였다.
      // 주소에서 온 팀·목록 id는 문자열일 수 있어 앞부분으로만 맞춘다
      queryClient.invalidateQueries({ queryKey: ["task-list-detail"] });
      queryClient.invalidateQueries({ queryKey: ["task-list"] });
      queryClient.invalidateQueries({ queryKey: ["task-list-comment", taskId] });
    },

    onError: () => {
      error("댓글 추가 실패");
    },
  });
};

export default usePostTaskListComment;
