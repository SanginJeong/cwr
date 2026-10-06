import { useQuery } from "@tanstack/react-query";
import { toKstDateString } from "@/shared/lib/kstDate";
import { getAttendanceRange, getLeaveRequests } from "./attendance.supabase";
import type { LeaveStatus } from "../model/types";

/** 출퇴근·휴가 결정 뒤에는 attendanceKeys.all을 무효화한다 */
export const attendanceKeys = {
  all: ["attendance"] as const,
  range: (params: { from: string; to: string; userId?: number }) =>
    [...attendanceKeys.all, "range", params.userId ?? "me", params.from, params.to] as const,
  leaves: (params: { userId?: number; status?: LeaveStatus; from?: string; to?: string }) =>
    [...attendanceKeys.all, "leaves", params] as const,
};

export const useAttendanceRange = (params: { from: string; to: string; userId?: number }, enabled = true) =>
  useQuery({
    queryKey: attendanceKeys.range(params),
    queryFn: () => getAttendanceRange(params),
    enabled,
    staleTime: 1000 * 60,
  });

/**
 * 오늘 기록과 적용 정책 (출퇴근 카드).
 * 요청 날짜는 브라우저의 KST 날짜지만, 판정 기준은 응답의 today(서버)를 쓴다.
 */
export const useTodayAttendance = (enabled = true) => {
  const today = toKstDateString(new Date());
  const query = useAttendanceRange({ from: today, to: today }, enabled);
  const record = query.data?.records.find((r) => r.kind === "WORK") ?? null;
  return { ...query, record };
};

export const useLeaveRequests = (
  params: { userId?: number; status?: LeaveStatus; from?: string; to?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: attendanceKeys.leaves(params),
    queryFn: () => getLeaveRequests(params),
    enabled,
    staleTime: 1000 * 60,
  });
