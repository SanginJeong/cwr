import patchGroup from "@/features/team/edit-team/api/patchGroup";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const usePatchGroup = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchGroup,
    onSuccess: () => {
      success("팀 이름을 성공적으로 변경하였습니다.");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => {
      error("팀 이름을 변경하지 못했습니다.");
    },
  });
};

export default usePatchGroup;
