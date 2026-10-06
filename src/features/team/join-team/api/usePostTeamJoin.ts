import { ApiError } from "@/shared/api/supabase/errors";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import postTeamJoin from "./postTeamJoin";
import { PostTeamJoinRequest, PostTeamJoinResponse } from "@/shared/api/types/teamJoinApi";
import { toastKit } from "@/shared/lib/toastKit";
import { ROUTES } from "@/shared/config/routes";

type UsePostTeamJoinOptions = {
  onSuccess?: (data: PostTeamJoinResponse) => void;
  onError?: (error: Error) => void;
};

const usePostTeamJoin = (options?: UsePostTeamJoinOptions) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation<PostTeamJoinResponse, Error, PostTeamJoinRequest>({
    mutationFn: postTeamJoin,
    onSuccess: (data) => {
      success("팀에 성공적으로 참여했습니다!");
      options?.onSuccess?.(data);
      router.push(ROUTES.team(data.groupId));

      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        error("로그인이 필요합니다.");
        router.push(ROUTES.login);
        return;
      }

      // 잘못된·만료된 링크, 이미 참여한 팀 등은 서버가 사용자용 문장으로 알려준다 (accept_invitation)
      error(err.message || "팀 참여에 실패했습니다.");

      options?.onError?.(err);
    },
  });
};

export default usePostTeamJoin;
