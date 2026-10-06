/**
 * 근태 도메인 타입의 단일 출처. HR-platform(다님)의 정책 엔진을 그대로 옮겼다 (roadmap H2, ADR-007).
 * 이 모듈은 순수 모듈이다 — DB, React, fetch에 의존하지 않는다.
 */

export type PolicyType = "AUTONOMOUS" | "CORE_TIME" | "FIXED";

export type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT" | "LEAVE";

export type Policy =
  | { type: "AUTONOMOUS" }
  | { type: "CORE_TIME"; coreStart: string; coreEnd: string } // "HH:mm"
  | { type: "FIXED"; workStart: string; graceMinutes: number }; // "HH:mm", 분

export interface DayRecord {
  /** "YYYY-MM-DD" */
  date: string;
  kind: "WORK" | "LEAVE";
  /**
   * 로컬 naive ISO ("YYYY-MM-DDTHH:mm:ss", 오프셋 없음).
   * 타임존 변환은 엔진 밖(attendance_range RPC가 KST로 바꿔 준다) — 엔진은 벽시계 시각만 비교한다.
   */
  clockInAt: string | null;
  clockOutAt: string | null;
}

export interface DailyEvaluation {
  /** "YYYY-MM-DD" */
  date: string;
  /** null = 평가 대상 아님 (주말, 아직 완결되지 않은 오늘/미래) */
  status: AttendanceStatus | null;
}
