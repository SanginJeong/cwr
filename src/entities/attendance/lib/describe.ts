import { evaluateDay, type AttendanceStatus, type DayRecord, type Policy } from "./policy-engine";

/** 화면 문구용 상태 이름 */
export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  ON_TIME: "정상",
  LATE: "지각",
  ABSENT: "결근",
  LEAVE: "휴가",
};

const POLICY_TYPE_LABEL: Record<Policy["type"], string> = {
  AUTONOMOUS: "자율 출퇴근",
  CORE_TIME: "코어타임",
  FIXED: "고정 근무",
};

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** 정상으로 판정되는 마지막 출근 시각 "HH:mm". 자율은 없음(null). 엔진의 경계(이하면 정상)와 같다 */
export const onTimeDeadline = (policy: Policy) =>
  policy.type === "CORE_TIME"
    ? policy.coreStart
    : policy.type === "FIXED"
      ? addMinutes(policy.workStart, policy.graceMinutes)
      : null;

/**
 * 정책을 사람이 읽는 문장으로 (내 근태 머리말, 사이드바 카드, H5 정책 화면의 판정 규칙 문장).
 * 엔진의 판정 규칙(policy-engine/index.ts)과 같은 내용이어야 한다.
 */
export const describePolicy = (policy: Policy) => {
  switch (policy.type) {
    case "AUTONOMOUS":
      return { typeLabel: POLICY_TYPE_LABEL.AUTONOMOUS, hours: null, rule: "출근 기록만 있으면 정상" };
    case "CORE_TIME":
      return {
        typeLabel: POLICY_TYPE_LABEL.CORE_TIME,
        hours: `${policy.coreStart}–${policy.coreEnd}`,
        rule: `${policy.coreStart}까지 출근하면 정상`,
      };
    case "FIXED":
      return {
        typeLabel: POLICY_TYPE_LABEL.FIXED,
        hours: `${policy.workStart} 출근`,
        rule:
          policy.graceMinutes > 0
            ? `${addMinutes(policy.workStart, policy.graceMinutes)}까지 출근하면 정상 (유예 ${policy.graceMinutes}분)`
            : `${policy.workStart}까지 출근하면 정상`,
      };
  }
};

export type ClockState = "BEFORE" | "WORKING" | "DONE";

/** 오늘 기록으로 출퇴근 카드의 상태를 정한다 */
export const getClockState = (record: Pick<DayRecord, "clockInAt" | "clockOutAt"> | null | undefined): ClockState => {
  if (!record?.clockInAt) return "BEFORE";
  return record.clockOutAt ? "DONE" : "WORKING";
};

/** naive ISO "YYYY-MM-DDTHH:mm:ss" → "HH:mm" */
export const formatClockTime = (naiveIso: string | null | undefined) => (naiveIso ? naiveIso.slice(11, 16) : "--:--");

/** 지금의 KST 벽시계 시각을 naive ISO로 (근무 시간 계산용. 판정의 기준 날짜는 서버의 today를 쓴다) */
export const nowKstNaiveIso = (now = new Date()) =>
  new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);

/** 출근부터 퇴근(없으면 지금)까지 분. 음수가 되지 않게 0에서 멈춘다 */
export const workedMinutes = (clockInAt: string, clockOutAt: string | null, nowNaiveIso: string) => {
  const toMs = (naive: string) => Date.parse(`${naive}Z`);
  return Math.max(0, Math.floor((toMs(clockOutAt ?? nowNaiveIso) - toMs(clockInAt)) / 60000));
};

/** 252 → "4시간 12분" */
export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
};

/** 오늘 출근했다면 엔진 판정 (아니면 null) */
export const evaluateToday = (record: DayRecord | null, policy: Policy, today: string) =>
  record?.clockInAt ? evaluateDay(record, policy, today, today) : null;
