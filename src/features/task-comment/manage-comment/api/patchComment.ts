import instance from "@/shared/api/instance";
import { PatchCommentRequest, PatchCommentResponse } from "@/shared/api/types/taskCommentApi";

const patchComment = async ({ taskId, commentId, content }: PatchCommentRequest): Promise<PatchCommentResponse> => {
  const response = await instance.patch<PatchCommentResponse>(`/tasks/${taskId}/comments/${commentId}`, { content });

  return response.data;
};

export default patchComment;
