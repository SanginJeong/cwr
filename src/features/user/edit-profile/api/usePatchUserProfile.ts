import { useMutation, useQueryClient } from "@tanstack/react-query";
import patchUserProfile from "./patchUserProfile";
import { toastKit } from "@/shared/lib/toastKit";

type UsePatchUserProfileOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const usePatchUserProfile = (options?: UsePatchUserProfileOptions) => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: patchUserProfile,
    onSuccess: () => {
      success("프로필이 성공적으로 변경되었습니다.");

      queryClient.invalidateQueries({ queryKey: ["user"] });

      options?.onSuccess?.();
    },
    onError: (err: Error) => {
      const message = err.message || "프로필 변경에 실패했습니다.";
      error(message);
      options?.onError?.(message);
    },
  });
};

export default usePatchUserProfile;
