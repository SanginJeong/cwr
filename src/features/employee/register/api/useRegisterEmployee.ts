import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "@/entities/employee";
import { ApiError } from "@/shared/api/supabase/errors";
import type { CompanyRole, UserRole } from "@/shared/api/types/UserType";

export interface RegisterEmployeeRequest {
  email: string;
  nickname: string;
  companyRole: CompanyRole;
  groupId: number | null;
  teamRole: UserRole;
  policyId: number | null;
}

export interface RegisterEmployeeResponse {
  userId: number;
  email: string;
  nickname: string;
  companyRole: CompanyRole;
  /** 응답으로 한 번만 온다. 다시 볼 수 없다 */
  temporaryPassword: string;
}

/** 직원 등록 BFF (POST /api/admin/employees). service role이 필요해서 서버에서 한다 (ADR-006) */
const registerEmployee = async (body: RegisterEmployeeRequest): Promise<RegisterEmployeeResponse> => {
  const res = await fetch("/api/admin/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.message ?? "직원을 등록하지 못했습니다.", res.status, json.field);
  return json;
};

const useRegisterEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export default useRegisterEmployee;
