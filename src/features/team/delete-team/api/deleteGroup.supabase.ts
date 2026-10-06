import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";

// RLS에 막힌 update/delete는 에러 없이 0건이라 assertAffected로 확인한다
export const deleteGroupWithSupabase = async (id: number): Promise<void> => {
  const { data, error } = await getSupabase().from("groups").delete().eq("id", id).select("id");
  if (error) throw toApiError(error, "팀을 삭제하지 못했습니다.");
  assertAffected(data, "인사담당자만 팀을 삭제할 수 있습니다.");
};
