import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapTaskComment, TaskCommentRow } from "@/shared/api/supabase/mappers/comment";
import { GetTaskListCommentResponse } from "@/shared/api/types/taskCommentApi";

/** 기존 구현은 응답을 뒤집어서 최신순으로 썼다. 같은 순서로 돌려준다 */
const getTaskListCommentWithSupabase = async (taskId: number): Promise<GetTaskListCommentResponse[]> => {
  const { data, error } = await getSupabase()
    .from("task_comment_view")
    .select()
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw toApiError(error, "댓글을 불러오지 못했습니다.");
  return (data as TaskCommentRow[]).map(mapTaskComment);
};

export default getTaskListCommentWithSupabase;
