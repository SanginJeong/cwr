import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceKeys, requestLeave } from "@/entities/attendance";
import { formatDayLabel } from "@/shared/lib/calendar";
import { toastKit } from "@/shared/lib/toastKit";

/** 휴가 신청 (request_leave RPC). 날짜 규칙(내일부터, 평일, 중복 불가)은 서버가 확인한다 */
const useRequestLeave = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();

  return useMutation({
    mutationFn: requestLeave,
    onSuccess: (leave) => success(`${formatDayLabel(leave.date)} 휴가를 신청했어요.`),
    onError: (err: Error) => error(err.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
};

export default useRequestLeave;
