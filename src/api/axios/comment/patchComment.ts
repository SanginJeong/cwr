import instance from "@/lib/axios";
import { PatchCommentRequest, PatchCommentResponse } from "./_types";

const patchComment = async ({ taskId, commentId, content }: PatchCommentRequest): Promise<PatchCommentResponse> => {
  const response = await instance.patch<PatchCommentResponse>(`/tasks/${taskId}/comments/${commentId}`, { content });

  return response.data;
};

export default patchComment;
