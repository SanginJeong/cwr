import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiErrorResponse } from "@/shared/api/types/ApiType";
import deleteUser from "./deleteUser";
import deleteUserWithSupabase from "./deleteUser.supabase";
import { isSupabase } from "@/shared/config/backend";
import { ApiError } from "@/shared/api/supabase/errors";
import { toastKit } from "@/shared/lib/toastKit";
import tokenStorage from "@/shared/api/tokenStorage";
import { clearAuthCookies } from "@/shared/api/authCookies";
import { ROUTES } from "@/shared/config/routes";

type UseDeleteUserOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const useDeleteUser = (options?: UseDeleteUserOptions) => {
  const router = useRouter();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: isSupabase ? deleteUserWithSupabase : deleteUser,
    onSuccess: async () => {
      await clearAuthCookies();

      tokenStorage.clearTokens();

      success("회원 탈퇴가 완료되었습니다.");
      options?.onSuccess?.();

      router.push(ROUTES.home);
    },
    onError: (err: AxiosError<ApiErrorResponse> | ApiError) => {
      const message =
        (err instanceof ApiError ? err.message : err.response?.data?.message || err.message) ||
        "회원 탈퇴에 실패했습니다.";
      error(message);
      options?.onError?.(message);
    },
  });
};

export default useDeleteUser;
