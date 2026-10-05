import instance from "@/shared/api/instance";
import { DeleteTaskListCommentRequest } from "@/shared/api/types/taskCommentApi";

const deleteComment = async ({ taskId, commentId }: DeleteTaskListCommentRequest) => {
  const response = await instance.delete(`/tasks/${taskId}/comments/${commentId}`);

  return response.data;
};

export default deleteComment;
