import { evaluateAttendance } from "./evaluateAttendance";
import type { TeamMemberAttendance } from "../model/types";

/** 팀원 한 명의 오늘. 미출근 = 판정 대상인 평일인데 아직 출근 기록이 없음 */
export type TeamTodayKind = "ON_TIME" | "LATE" | "LEAVE" | "NOT_YET";

export interface MemberToday {
  userId: number;
  /** null: 판정하지 않는 날 (주말, 입사 전) */
  kind: TeamTodayKind | null;
  clockInAt: string | null;
  clockOutAt: string | null;
}

const isWeekend = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/** team_attendance_range(오늘~오늘) 응답의 한 멤버 → 오늘 상태. 판정은 정책 엔진 */
export const getMemberToday = (
  member: Pick<TeamMemberAttendance, "userId" | "records" | "policy" | "hiredOn">,
  today: string,
): MemberToday => {
  const work = member.records.find((r) => r.kind === "WORK" && r.date === today) ?? null;
  const [evaluation] = evaluateAttendance(member, today, today, today);
  const status = evaluation?.status ?? null;

  let kind: TeamTodayKind | null = null;
  if (status === "ON_TIME" || status === "LATE" || status === "LEAVE") kind = status;
  else if (!isWeekend(today) && today >= member.hiredOn && !work?.clockInAt) kind = "NOT_YET";

  return { userId: member.userId, kind, clockInAt: work?.clockInAt ?? null, clockOutAt: work?.clockOutAt ?? null };
};

export const summarizeTeamToday = (members: MemberToday[]) => {
  const summary: Record<TeamTodayKind, number> = { ON_TIME: 0, LATE: 0, LEAVE: 0, NOT_YET: 0 };
  for (const { kind } of members) if (kind) summary[kind] += 1;
  return summary;
};
