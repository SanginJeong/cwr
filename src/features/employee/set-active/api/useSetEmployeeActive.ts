import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "@/entities/employee";
import { ApiError } from "@/shared/api/supabase/errors";
import { toastKit } from "@/shared/lib/toastKit";

/** 퇴사 처리·복직 BFF (PATCH /api/admin/employees/{id}). DB 비활성화 + Auth 로그인 차단·해제 */
const setEmployeeActive = async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
  const res = await fetch(`/api/admin/employees/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.message ?? "처리하지 못했습니다.", res.status);
};

const useSetEmployeeActive = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();
  return useMutation({
    mutationFn: setEmployeeActive,
    onSuccess: (_data, { isActive }) => success(isActive ? "복직 처리했어요." : "퇴사 처리했어요. 로그인이 차단돼요."),
    onError: (err: Error) => error(err.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export default useSetEmployeeActive;
