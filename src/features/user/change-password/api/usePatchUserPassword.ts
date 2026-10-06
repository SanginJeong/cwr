import { useMutation } from "@tanstack/react-query";
import patchUserPassword from "./patchUserPassword";
import { toastKit } from "@/shared/lib/toastKit";

type UsePatchUserPasswordOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const usePatchUserPassword = (options?: UsePatchUserPasswordOptions) => {
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: patchUserPassword,
    onSuccess: () => {
      success("비밀번호가 성공적으로 변경되었습니다.");
      options?.onSuccess?.();
    },
    onError: (err: Error) => {
      const message = err.message || "비밀번호 변경에 실패했습니다.";
      error(message);
      options?.onError?.(message);
    },
  });
};

export default usePatchUserPassword;
