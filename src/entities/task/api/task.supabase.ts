import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { GetTaskDetailResponse, TaskResponse } from "@/shared/api/types/taskApi";
import { toKstDateString } from "@/shared/lib/kstDate";

/**
 * 그날의 할 일. tasks_for_date가 반복 규칙으로 할 일을 만들고(없으면) 돌려준다 (ADR-004 §2).
 * 기존 구현은 응답을 뒤집어서 썼다. 같은 순서가 되도록 뒤집는다.
 */
export const getTasksWithSupabase = async (taskListId: number, date?: string | null): Promise<TaskResponse> => {
  const { data, error } = await getSupabase().rpc("tasks_for_date", {
    p_task_list_id: taskListId,
    p_date: date ? toKstDateString(date) : null,
  });
  if (error) throw toApiError(error, "할 일을 불러오지 못했습니다.");
  return (data as TaskResponse).reverse();
};

export const getTaskDetailWithSupabase = async (taskId: number): Promise<GetTaskDetailResponse> => {
  const { data, error } = await getSupabase().rpc("get_task", { p_task_id: taskId });
  if (error) throw toApiError(error, "할 일을 불러오지 못했습니다.");
  return data;
};
