import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import type { AdminEmployees, AdminPolicy } from "../model/types";

/** 구성원 목록 (퇴사자 포함) + [from, to] 근태. 인사담당자 전용 */
export const getAdminEmployees = async <TAttendance = object>(params: { from: string; to: string }) => {
  const { data, error } = await getSupabase().rpc("admin_employees", { p_from: params.from, p_to: params.to });
  if (error) throw toApiError(error, "구성원 목록을 불러오지 못했습니다.");
  return data as unknown as AdminEmployees<TAttendance>;
};

export const getAdminPolicies = async <TPolicy = object>() => {
  const { data, error } = await getSupabase().rpc("admin_policies");
  if (error) throw toApiError(error, "근태 정책을 불러오지 못했습니다.");
  return data as unknown as AdminPolicy<TPolicy>[];
};
