import postResetPassword from "./resetPassword";
import sendResetPasswordEmailWithSupabase from "./resetPassword.supabase";
import { isSupabase } from "@/shared/config/backend";
import { ResetPasswordRequest } from "@/shared/api/types/authApi";
import { useMutation } from "@tanstack/react-query";

type UsePostResetPwOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const usePostResetPw = (options?: UsePostResetPwOptions) => {
  return useMutation({
    mutationFn: async (request: ResetPasswordRequest) => {
      if (isSupabase) await sendResetPasswordEmailWithSupabase(request);
      else await postResetPassword(request);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
    },
  });
};

export default usePostResetPw;
