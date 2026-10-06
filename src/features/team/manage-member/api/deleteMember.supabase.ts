import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";

// RLS에 막힌 update/delete는 에러 없이 0건이라 assertAffected로 확인한다
export const deleteMemberWithSupabase = async (groupId: number, memberUserId: number): Promise<void> => {
  const { data, error } = await getSupabase()
    .from("memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId)
    .select("user_id");
  if (error) throw toApiError(error, "팀에서 제외하지 못했습니다.");
  assertAffected(data, "인사담당자만 팀에서 제외할 수 있습니다.");
};
