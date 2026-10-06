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
  if (error) throw toApiError(error, "멤버를 내보내지 못했습니다.");
  assertAffected(data, "관리자만 멤버를 내보낼 수 있습니다. 관리자는 내보낼 수 없습니다.");
};
