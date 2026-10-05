import postCreateTeam from "@/features/team/create-team/api/postCreateTeam";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

interface ErrorResponse {
  message: string;
}

const usePostCreateTeam = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: postCreateTeam,
    onSuccess: (data) => {
      success("팀 생성 완료");
      router.push(`/team/${data.id}`);

      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err: AxiosError<ErrorResponse>) => {
      const message = err.response?.data?.message || err.message || "팀 생성에 실패했습니다.";
      error(message);
    },
  });
};

export default usePostCreateTeam;
