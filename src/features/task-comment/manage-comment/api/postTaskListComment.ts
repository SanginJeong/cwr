import instance from "@/shared/api/instance";
import { PostTaskListCommentRequest, PostTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";

const postTaskListComment = async ({
  taskId,
  content,
}: PostTaskListCommentRequest): Promise<PostTaskListCommentResponse> => {
  const response = await instance.post<PostTaskListCommentResponse>(`/tasks/${taskId}/comments`, { content });

  return response.data;
};

export default postTaskListComment;
