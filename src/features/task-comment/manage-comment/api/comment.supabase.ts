import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { mapTaskComment, TaskCommentRow } from "@/shared/api/supabase/mappers/comment";
import { PatchCommentResponse, PostTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";

// 작성자는 컬럼 기본값(current_profile_id)으로 정해진다. 수정·삭제는 작성자만 (RLS)

const fetchComment = async (id: number) => {
  const { data, error } = await getSupabase().from("task_comment_view").select().eq("id", id).single();
  if (error) throw toApiError(error, "댓글을 불러오지 못했습니다.");
  return mapTaskComment(data as TaskCommentRow);
};

export const postCommentWithSupabase = async (
  taskId: number,
  content: string,
): Promise<PostTaskListCommentResponse> => {
  const { data, error } = await getSupabase()
    .from("task_comments")
    .insert({ task_id: taskId, content })
    .select("id")
    .single();
  if (error) throw toApiError(error, "댓글을 작성하지 못했습니다.");
  return fetchComment(data.id);
};

export const patchCommentWithSupabase = async (commentId: number, content: string): Promise<PatchCommentResponse> => {
  const { data, error } = await getSupabase()
    .from("task_comments")
    .update({ content })
    .eq("id", commentId)
    .select("id");
  if (error) throw toApiError(error, "댓글을 수정하지 못했습니다.");
  assertAffected(data, "댓글 작성자만 수정할 수 있습니다.");
  return fetchComment(commentId);
};

export const deleteCommentWithSupabase = async (commentId: number): Promise<void> => {
  const { data, error } = await getSupabase().from("task_comments").delete().eq("id", commentId).select("id");
  if (error) throw toApiError(error, "댓글을 삭제하지 못했습니다.");
  assertAffected(data, "댓글 작성자만 삭제할 수 있습니다.");
};
