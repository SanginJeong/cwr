import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "@/entities/employee";
import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import type { CompanyRole, UserRole } from "@/shared/api/types/UserType";
import { toastKit } from "@/shared/lib/toastKit";

interface UpdateEmployeeRequest {
  userId: number;
  nickname: string;
  hiredOn: string;
  companyRole: CompanyRole;
  /** 바뀐 경우에만. null이면 기본 정책 */
  policyId?: number | null;
}

/** 정보 수정 (admin_update_employee) + 정책 배정 (set_employee_policy) */
const updateEmployee = async ({ userId, nickname, hiredOn, companyRole, policyId }: UpdateEmployeeRequest) => {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_update_employee", {
    p_user_id: userId,
    p_nickname: nickname,
    p_hired_on: hiredOn,
    p_company_role: companyRole,
  });
  if (error) throw toApiError(error, "정보를 수정하지 못했습니다.");
  if (policyId !== undefined) {
    // RPC 인자 타입은 number지만 SQL은 null(기본 정책)을 받는다
    const { error: policyError } = await supabase.rpc("set_employee_policy", {
      p_user_id: userId,
      p_policy_id: policyId as number,
    });
    if (policyError) throw toApiError(policyError, "정책을 배정하지 못했습니다.");
  }
};

/** 팀 배정·팀장 지정·배정 해제 (memberships, 인사담당자 RLS). RLS에 막히면 0건이라 결과 행으로 확인한다 */
type MembershipChange =
  | { type: "add"; userId: number; groupId: number; role: UserRole }
  | { type: "role"; userId: number; groupId: number; role: UserRole }
  | { type: "remove"; userId: number; groupId: number };

const changeMembership = async (change: MembershipChange) => {
  const table = getSupabase().from("memberships");
  const { data, error } =
    change.type === "add"
      ? await table.insert({ group_id: change.groupId, user_id: change.userId, role: change.role }).select("user_id")
      : change.type === "role"
        ? await table
            .update({ role: change.role })
            .eq("group_id", change.groupId)
            .eq("user_id", change.userId)
            .select("user_id")
        : await table.delete().eq("group_id", change.groupId).eq("user_id", change.userId).select("user_id");
  if (error) {
    throw toApiError(error, error.code === "23505" ? "이미 배정된 팀입니다." : "팀 배정을 바꾸지 못했습니다.");
  }
  assertAffected(data, "팀 배정을 바꾸지 못했습니다.");
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();
  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => success("정보를 저장했어요."),
    onError: (err: Error) => error(err.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      // 이름이 바뀌면 팀 멤버 목록·내 정보에도 보인다
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useChangeMembership = () => {
  const queryClient = useQueryClient();
  const { error } = toastKit();
  return useMutation({
    mutationFn: changeMembership,
    onError: (err: Error) => error(err.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
