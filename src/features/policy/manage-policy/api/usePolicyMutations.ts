import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Policy } from "@/entities/attendance";
import { attendanceKeys } from "@/entities/attendance";
import { employeeKeys } from "@/entities/employee";
import { getSupabase } from "@/shared/api/supabase/client";
import { assertAffected, toApiError } from "@/shared/api/supabase/errors";
import { toastKit } from "@/shared/lib/toastKit";

export interface PolicyDraft {
  /** 없으면 새 정책 */
  id?: number;
  name: string;
  policy: Policy;
}

/** 엔진의 Policy → policies 행. 유형에 쓰지 않는 칸은 null (DB CHECK와 같은 규칙) */
const toRow = ({ name, policy }: PolicyDraft) => ({
  name: name.trim(),
  type: policy.type,
  core_start: policy.type === "CORE_TIME" ? policy.coreStart : null,
  core_end: policy.type === "CORE_TIME" ? policy.coreEnd : null,
  work_start: policy.type === "FIXED" ? policy.workStart : null,
  grace_minutes: policy.type === "FIXED" ? policy.graceMinutes : null,
});

const savePolicy = async (draft: PolicyDraft) => {
  const table = getSupabase().from("policies");
  const { data, error } = draft.id
    ? await table.update(toRow(draft)).eq("id", draft.id).select("id")
    : await table.insert(toRow(draft)).select("id");
  if (error) throw toApiError(error, error.code === "23514" ? "입력값을 확인해주세요." : "정책을 저장하지 못했습니다.");
  return assertAffected(data, "정책을 저장하지 못했습니다.")[0].id;
};

const deletePolicy = async (id: number) => {
  const { data, error } = await getSupabase().from("policies").delete().eq("id", id).select("id");
  // 23001: 배정된 직원이 있다 (on delete restrict)
  if (error)
    throw toApiError(
      error,
      error.code === "23001" ? "배정된 직원이 있어 지울 수 없습니다." : "정책을 지우지 못했습니다.",
    );
  assertAffected(data, "기본 정책은 지울 수 없습니다.");
};

const setDefaultPolicy = async (id: number) => {
  const { error } = await getSupabase().rpc("set_default_policy", { p_policy_id: id });
  if (error) throw toApiError(error, "기본 정책을 바꾸지 못했습니다.");
};

/** 정책이 바뀌면 지난 기록도 새 정책으로 다시 판정되므로 근태 조회도 함께 새로 받는다 (ADR-007) */
const usePolicyMutation = <T, R>(fn: (arg: T) => Promise<R>, message: string) => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => success(message),
    onError: (err: Error) => error(err.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useSavePolicy = () => usePolicyMutation(savePolicy, "정책을 저장했어요.");
export const useDeletePolicy = () => usePolicyMutation(deletePolicy, "정책을 지웠어요.");
export const useSetDefaultPolicy = () => usePolicyMutation(setDefaultPolicy, "기본 정책을 바꿨어요.");
