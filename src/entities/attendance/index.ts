export { evaluateDay, evaluateRange } from "./lib/policy-engine";
export type { AttendanceStatus, DailyEvaluation, DayRecord, Policy, PolicyType } from "./lib/policy-engine";
export { evaluateAttendance, summarizeAttendance, toEnginePolicy } from "./lib/evaluateAttendance";
export type { AttendanceSummary } from "./lib/evaluateAttendance";
export {
  STATUS_LABEL,
  describePolicy,
  evaluateToday,
  formatClockTime,
  formatDuration,
  getClockState,
  nowKstNaiveIso,
  workedMinutes,
} from "./lib/describe";
export type { ClockState } from "./lib/describe";
export * from "./api/attendance.supabase";
export {
  attendanceKeys,
  useAttendanceRange,
  useLeaveRequests,
  useReviewLeaveRequests,
  useTeamAttendanceRange,
  useTeamLeaveCalendar,
  useTodayAttendance,
} from "./api/queries";
export { getMemberToday, summarizeTeamToday } from "./lib/teamToday";
export type { MemberToday, TeamTodayKind } from "./lib/teamToday";
export type * from "./model/types";
export { default as AttendanceChip, CHIP_DOT, CHIP_LABEL, CHIP_STYLE } from "./ui/AttendanceChip";
export type { ChipKind } from "./ui/AttendanceChip";
