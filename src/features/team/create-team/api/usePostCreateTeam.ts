import postCreateTeam from "./postCreateTeam";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

const usePostCreateTeam = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: postCreateTeam,
    onSuccess: (data) => {
      success("팀 생성 완료");
      router.push(ROUTES.team(data.id));

      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err: Error) => {
      const message = err.message || "팀 생성에 실패했습니다.";
      error(message);
    },
  });
};

export default usePostCreateTeam;
