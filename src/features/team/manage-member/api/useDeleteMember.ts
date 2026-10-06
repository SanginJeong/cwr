import deleteMember from "./deleteMember";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteMember = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["deleteMember"],
    mutationFn: deleteMember,
    onSuccess: () => {
      success("팀에서 제외했습니다.");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: () => {
      error("팀에서 제외하지 못했습니다.");
    },
  });
};

export default useDeleteMember;
