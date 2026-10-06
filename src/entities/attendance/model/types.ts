import type { DayRecord, Policy } from "../lib/policy-engine";
import type { UserRole } from "@/shared/api/types/UserType";

/** policy_json (supabase/migrations/..._attendance.sql). 엔진의 Policy에 표시용 필드를 더한 모양 */
export type PolicyInfo = Policy & { id: number; name: string; isDefault: boolean };

/** attendance_range RPC 응답. records는 엔진 입력 그대로 (KST naive ISO, 승인된 휴가만 LEAVE) */
export interface AttendanceRange {
  userId: number;
  policy: PolicyInfo;
  records: DayRecord[];
  /** 서버의 KST 날짜 "YYYY-MM-DD". 엔진의 기준 날짜로 쓴다 (브라우저 시계를 믿지 않는다) */
  today: string;
}

export interface TeamMemberAttendance extends Omit<AttendanceRange, "today"> {
  userName: string;
  role: UserRole;
}

/** team_attendance_range RPC 응답. 퇴사자는 빠져 있다 */
export interface TeamAttendanceRange {
  today: string;
  members: TeamMemberAttendance[];
}

/** clock_in / clock_out 응답 */
export interface AttendanceRecord {
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

/** leave_request_json */
export interface LeaveRequest {
  id: number;
  userId: number;
  date: string;
  status: LeaveStatus;
  reason: string | null;
  decidedBy: number | null;
  decidedAt: string | null;
  createdAt: string;
}
