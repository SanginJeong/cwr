import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import patchResetPassword from "./patchResetPassword";
import updatePasswordWithSupabase from "./updatePassword.supabase";
import { isSupabase } from "@/shared/config/backend";
import { ApiError } from "@/shared/api/supabase/errors";
import { PatchResetPasswordRequest } from "@/shared/api/types/authApi";
import { ApiErrorResponse } from "@/shared/api/types/ApiType";
import { toastKit } from "@/shared/lib/toastKit";
import { ROUTES } from "@/shared/config/routes";

type UsePatchResetPasswordOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const usePatchResetPassword = (options?: UsePatchResetPasswordOptions) => {
  const router = useRouter();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: async (request: PatchResetPasswordRequest) =>
      isSupabase ? updatePasswordWithSupabase(request) : patchResetPassword(request),
    onSuccess: () => {
      success("비밀번호가 성공적으로 변경되었습니다.");
      options?.onSuccess?.();
      router.replace(ROUTES.login);
    },
    onError: (err: AxiosError<ApiErrorResponse> | ApiError) => {
      const message =
        (err instanceof ApiError ? err.message : err.response?.data?.message || err.message) ||
        "비밀번호 재설정에 실패했습니다.";
      error(message);
      options?.onError?.(message);
    },
  });
};

export default usePatchResetPassword;
