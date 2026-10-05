import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { mapTaskListRow } from "@/shared/api/supabase/mappers/taskList";
import { PostTaskListRequest, PostTaskListResponse } from "@/shared/api/types/taskListApi";

// 할 일 목록은 그룹 멤버 모두 생성·수정·삭제할 수 있다 (ADR-004 §3). display_index는 트리거가 정한다

export const postTaskListWithSupabase = async ({
  groupId,
  name,
}: PostTaskListRequest): Promise<PostTaskListResponse> => {
  const { data, error } = await getSupabase().from("task_lists").insert({ group_id: groupId, name }).select().single();
  if (error) throw toApiError(error, "할 일 목록을 만들지 못했습니다.");
  return mapTaskListRow(data);
};

export const renameTaskListWithSupabase = async (id: number, name: string): Promise<PostTaskListResponse> => {
  const { data, error } = await getSupabase().from("task_lists").update({ name }).eq("id", id).select();
  if (error) throw toApiError(error, "할 일 목록 이름을 바꾸지 못했습니다.");
  return mapTaskListRow(assertAffected(data)[0]);
};

export const deleteTaskListWithSupabase = async (id: number): Promise<void> => {
  const { data, error } = await getSupabase().from("task_lists").delete().eq("id", id).select("id");
  if (error) throw toApiError(error, "할 일 목록을 삭제하지 못했습니다.");
  assertAffected(data);
};
