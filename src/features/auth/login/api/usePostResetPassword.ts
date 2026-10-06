import sendResetPasswordEmailWithSupabase from "./resetPassword.supabase";
import { useMutation } from "@tanstack/react-query";

type UsePostResetPwOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const usePostResetPw = (options?: UsePostResetPwOptions) => {
  return useMutation({
    mutationFn: sendResetPasswordEmailWithSupabase,
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error.message);
    },
  });
};

export default usePostResetPw;
