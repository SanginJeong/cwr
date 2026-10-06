import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { mapGroupRow } from "@/shared/api/supabase/mappers/group";
import { PatchGroupRequest, PatchGroupResponse } from "@/shared/api/types/groupApi";

// RLS에 막힌 update/delete는 에러 없이 0건이라 assertAffected로 확인한다
export const patchGroupWithSupabase = async ({ param, body }: PatchGroupRequest): Promise<PatchGroupResponse> => {
  const { data, error } = await getSupabase().from("groups").update(body).eq("id", param.id).select();
  if (error) throw toApiError(error, "팀 정보를 수정하지 못했습니다.");
  return mapGroupRow(assertAffected(data, "관리자만 팀 정보를 수정할 수 있습니다.")[0]);
};
