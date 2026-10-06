import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceKeys, decideLeave } from "@/entities/attendance";
import { toastKit } from "@/shared/lib/toastKit";

/**
 * 휴가 승인·반려 (decide_leave RPC). 먼저 처리한 결정이 적용되므로,
 * 다른 사람이 먼저 처리했으면 서버가 "이미 처리된 신청입니다"를 돌려주고 목록을 새로 받는다
 */
const useDecideLeave = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: decideLeave,
    onSuccess: (leave) => success(leave.status === "APPROVED" ? "휴가를 승인했어요." : "휴가를 반려했어요."),
    onError: (err: Error) => error(err.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
};

export default useDecideLeave;
