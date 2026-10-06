import { PatchCommentRequest, PatchCommentResponse } from "@/shared/api/types/taskCommentApi";
import { patchCommentWithSupabase } from "./comment.supabase";

const patchComment = async ({ commentId, content }: PatchCommentRequest): Promise<PatchCommentResponse> => {
  return patchCommentWithSupabase(commentId, content);
};

export default patchComment;
