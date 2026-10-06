import deleteGroup from "./deleteGroup";
import { toastKit } from "@/shared/lib/toastKit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

const useDeleteGroup = () => {
  const { success, error } = toastKit();
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_data, { id }) => {
      success("팀을 성공적으로 삭제 하였습니다.");
      // 삭제한 팀은 다시 조회하지 않는다 (이동 전까지 화면에 남아 있어 404가 난다)
      queryClient.invalidateQueries({
        queryKey: ["groups"],
        predicate: (query) => query.queryKey[1] !== id,
      });
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      router.replace(ROUTES.teams);
    },
    onError: () => error("팀을 삭제하지 못하였습니다."),
  });
};

export default useDeleteGroup;
