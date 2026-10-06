import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import type {
  AttendanceRange,
  AttendanceRecord,
  LeaveRequest,
  LeaveStatus,
  ReviewLeaveRequest,
  TeamAttendanceRange,
  TeamLeaveCalendar,
} from "../model/types";

/**
 * 근태 RPC (supabase/migrations/20261006000006_attendance.sql, ADR-007).
 * jsonb 응답의 모양은 model/types.ts에 있다. shared는 entities를 참조할 수 없어서
 * RpcJsonReturns 대신 여기서 바로 읽는다.
 */
const asJson = <T>(data: unknown) => data as T;

/** 기간은 "YYYY-MM-DD", 최대 93일. userId를 비우면 본인 */
export const getAttendanceRange = async (params: { from: string; to: string; userId?: number }) => {
  const { data, error } = await getSupabase().rpc("attendance_range", {
    p_from: params.from,
    p_to: params.to,
    p_user_id: params.userId,
  });
  if (error) throw toApiError(error, "근태 기록을 불러오지 못했습니다.");
  return asJson<AttendanceRange>(data);
};

/** 팀장(그 팀의 ADMIN) 또는 인사담당자 */
export const getTeamAttendanceRange = async (params: { groupId: number; from: string; to: string }) => {
  const { data, error } = await getSupabase().rpc("team_attendance_range", {
    p_group_id: params.groupId,
    p_from: params.from,
    p_to: params.to,
  });
  if (error) throw toApiError(error, "팀 근태를 불러오지 못했습니다.");
  return asJson<TeamAttendanceRange>(data);
};

export const clockIn = async () => {
  const { data, error } = await getSupabase().rpc("clock_in");
  if (error) throw toApiError(error, "출근을 기록하지 못했습니다.");
  return asJson<AttendanceRecord>(data);
};

export const clockOut = async () => {
  const { data, error } = await getSupabase().rpc("clock_out");
  if (error) throw toApiError(error, "퇴근을 기록하지 못했습니다.");
  return asJson<AttendanceRecord>(data);
};

export const requestLeave = async (params: { date: string; reason?: string }) => {
  const { data, error } = await getSupabase().rpc("request_leave", { p_date: params.date, p_reason: params.reason });
  if (error) throw toApiError(error, "휴가를 신청하지 못했습니다.");
  return asJson<LeaveRequest>(data);
};

export const cancelLeave = async (requestId: number) => {
  const { error } = await getSupabase().rpc("cancel_leave", { p_request_id: requestId });
  if (error) throw toApiError(error, "휴가 신청을 취소하지 못했습니다.");
};

export const decideLeave = async (params: { requestId: number; approve: boolean }) => {
  const { data, error } = await getSupabase().rpc("decide_leave", {
    p_request_id: params.requestId,
    p_approve: params.approve,
  });
  if (error) throw toApiError(error, "휴가 신청을 처리하지 못했습니다.");
  return asJson<LeaveRequest>(data);
};

/**
 * 휴가 신청 목록. RLS로 본인·내가 팀장인 팀원·(인사담당자는) 전체가 보인다.
 * userId로 한 사람만, status로 상태를 거른다. 날짜 오름차순
 */
export const getLeaveRequests = async (params: {
  userId?: number;
  status?: LeaveStatus;
  from?: string;
  to?: string;
}) => {
  let query = getSupabase()
    .from("leave_requests")
    .select("id, user_id, date, status, reason, decided_by, decided_at, created_at")
    .order("date");
  if (params.userId !== undefined) query = query.eq("user_id", params.userId);
  if (params.status) query = query.eq("status", params.status);
  if (params.from) query = query.gte("date", params.from);
  if (params.to) query = query.lte("date", params.to);

  const { data, error } = await query;
  if (error) throw toApiError(error, "휴가 신청을 불러오지 못했습니다.");
  return data.map(
    (row): LeaveRequest => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      status: row.status as LeaveStatus,
      reason: row.reason,
      decidedBy: row.decided_by,
      decidedAt: row.decided_at,
      createdAt: row.created_at,
    }),
  );
};

/** 내가 결정할 수 있는 휴가 신청 (팀장: 팀원, 인사담당자: 전체). pending=false면 처리된 최근 100건 */
export const getReviewLeaveRequests = async (pending: boolean) => {
  const { data, error } = await getSupabase().rpc("review_leave_requests", { p_pending: pending });
  if (error) throw toApiError(error, "휴가 신청을 불러오지 못했습니다.");
  return asJson<ReviewLeaveRequest[]>(data);
};

/** 팀의 대기·승인 휴가 (팀장·인사담당자) */
export const getTeamLeaveCalendar = async (params: { groupId: number; from: string; to: string }) => {
  const { data, error } = await getSupabase().rpc("team_leave_calendar", {
    p_group_id: params.groupId,
    p_from: params.from,
    p_to: params.to,
  });
  if (error) throw toApiError(error, "팀 휴가를 불러오지 못했습니다.");
  return asJson<TeamLeaveCalendar>(data);
};
