import { useMutation, useQueryClient } from "@tanstack/react-query";
import patchUserProfile from "./patchUserProfile";
import { toastKit } from "@/shared/lib/toastKit";
import { ApiError } from "@/shared/api/supabase/errors";

type UsePatchUserProfileOptions = {
  onSuccess?: () => void;
  /** field: 입력란 하나의 에러면 그 칸 (예: "nickname"). 그때는 토스트 대신 입력란에 보여준다 */
  onError?: (message: string, field?: string) => void;
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
      const field = err instanceof ApiError ? err.field : undefined;
      if (!field) error(message);
      options?.onError?.(message, field);
    },
  });
};

export default usePatchUserProfile;
