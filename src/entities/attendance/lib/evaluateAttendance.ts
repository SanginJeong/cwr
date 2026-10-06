import { evaluateRange, type AttendanceStatus, type DailyEvaluation, type Policy } from "./policy-engine";
import type { AttendanceRange, PolicyInfo } from "../model/types";

/** 표시용 필드를 떼고 엔진이 받는 Policy만 남긴다 */
export const toEnginePolicy = (policy: PolicyInfo): Policy => {
  switch (policy.type) {
    case "AUTONOMOUS":
      return { type: "AUTONOMOUS" };
    case "CORE_TIME":
      return { type: "CORE_TIME", coreStart: policy.coreStart, coreEnd: policy.coreEnd };
    case "FIXED":
      return { type: "FIXED", workStart: policy.workStart, graceMinutes: policy.graceMinutes };
  }
};

/**
 * attendance_range 응답을 [from, to] 일별 판정으로 바꾼다.
 * 판정은 저장하지 않고 화면에서 매번 계산한다 (ADR-007). 기준 날짜는 서버가 준 today.
 * 입사일 전은 판정 대상이 아니다 (null). 엔진은 입사일을 모르므로 여기서 거른다
 */
export const evaluateAttendance = (
  range: Pick<AttendanceRange, "records" | "policy" | "hiredOn">,
  from: string,
  to: string,
  today: string,
): DailyEvaluation[] =>
  evaluateRange(range.records, toEnginePolicy(range.policy), from, to, today).map((evaluation) =>
    evaluation.date < range.hiredOn ? { date: evaluation.date, status: null } : evaluation,
  );

export type AttendanceSummary = Record<AttendanceStatus, number>;

/** 상태별 일수. 판정 대상이 아닌 날(주말, 오늘 출근 전, 미래)은 세지 않는다 */
export const summarizeAttendance = (evaluations: DailyEvaluation[]): AttendanceSummary => {
  const summary: AttendanceSummary = { ON_TIME: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
  for (const { status } of evaluations) {
    if (status) summary[status] += 1;
  }
  return summary;
};
