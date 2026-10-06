import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceKeys, cancelLeave } from "@/entities/attendance";
import { toastKit } from "@/shared/lib/toastKit";

/** 대기 중인 본인 휴가 신청 취소 (cancel_leave RPC) */
const useCancelLeave = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: cancelLeave,
    onSuccess: () => success("휴가 신청을 취소했어요."),
    // 그 사이 승인·반려됐다면 서버가 이유를 알려준다
    onError: (err: Error) => error(err.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
};

export default useCancelLeave;
