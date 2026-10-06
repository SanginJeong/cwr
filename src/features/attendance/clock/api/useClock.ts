import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceKeys, clockIn, clockOut } from "@/entities/attendance";
import { toastKit } from "@/shared/lib/toastKit";

/** 출근·퇴근. 시각은 서버가 정한다 (clock_in / clock_out RPC) */
const useClock = () => {
  const queryClient = useQueryClient();
  const { success, error } = toastKit();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

  const clockInMutation = useMutation({
    mutationFn: clockIn,
    onSuccess: (record) => success(`${record.clockInAt.slice(11, 16)} 출근했어요.`),
    onError: (err: Error) => error(err.message),
    onSettled,
  });

  const clockOutMutation = useMutation({
    mutationFn: clockOut,
    onSuccess: (record) => success(`${record.clockOutAt?.slice(11, 16)} 퇴근했어요. 수고하셨어요!`),
    onError: (err: Error) => error(err.message),
    onSettled,
  });

  return {
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    isPending: clockInMutation.isPending || clockOutMutation.isPending,
  };
};

export default useClock;
