import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapHistoryItem, TaskJson } from "@/shared/api/supabase/mappers/task";
import { PatchTaskDetailRequest, PatchTaskDetailResponse } from "@/shared/api/types/taskApi";

/** 이름·설명을 바꾸면 그 날짜만 바뀐다. done이면 완료자는 요청한 사람 (ADR-004 §2) */
export const patchTaskWithSupabase = async (
  taskId: number,
  { name, description, done }: PatchTaskDetailRequest["body"],
): Promise<PatchTaskDetailResponse> => {
  const { data, error } = await getSupabase().rpc("update_task", {
    p_task_id: taskId,
    p_name: name ?? null,
    p_description: description ?? null,
    p_done: done ?? null,
  });
  if (error) throw toApiError(error, "할 일을 수정하지 못했습니다.");
  // 기존 PATCH 응답은 writer/doneBy 객체 대신 writerId/userId를 준다
  return mapHistoryItem(data as TaskJson);
};

/** 그 날짜만 지운다 (soft delete) */
export const deleteTaskWithSupabase = async (taskId: number): Promise<void> => {
  const { error } = await getSupabase().rpc("delete_task", { p_task_id: taskId });
  if (error) throw toApiError(error, "할 일을 삭제하지 못했습니다.");
};
