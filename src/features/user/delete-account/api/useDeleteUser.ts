import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import deleteUserWithSupabase from "./deleteUser.supabase";
import { toastKit } from "@/shared/lib/toastKit";
import { ROUTES } from "@/shared/config/routes";

type UseDeleteUserOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const useDeleteUser = (options?: UseDeleteUserOptions) => {
  const router = useRouter();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: deleteUserWithSupabase,
    onSuccess: () => {
      success("회원 탈퇴가 완료되었습니다.");
      options?.onSuccess?.();

      router.push(ROUTES.home);
    },
    onError: (err: Error) => {
      const message = err.message || "회원 탈퇴에 실패했습니다.";
      error(message);
      options?.onError?.(message);
    },
  });
};

export default useDeleteUser;
