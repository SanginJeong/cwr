import instance from "@/shared/api/instance";
import { PatchCommentRequest, PatchCommentResponse } from "@/shared/api/types/taskCommentApi";
import { patchCommentWithSupabase } from "./comment.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchComment = async ({ taskId, commentId, content }: PatchCommentRequest): Promise<PatchCommentResponse> => {
  if (isSupabase) return patchCommentWithSupabase(commentId, content);

  const response = await instance.patch<PatchCommentResponse>(`/tasks/${taskId}/comments/${commentId}`, { content });

  return response.data;
};

export default patchComment;
