import type { AttendanceStatus, DailyEvaluation, DayRecord, Policy } from "./types";

export type * from "./types";

/** 0=일 … 6=토. UTC 고정 파싱이라 실행 환경 타임존과 무관하게 결정적이다. */
function dayOfWeekOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function isWeekend(date: string): boolean {
  const day = dayOfWeekOf(date);
  return day === 0 || day === 6;
}

/** "HH:mm" 또는 "HH:mm:ss" → 자정 기준 초 */
function secondsOfDay(time: string): number {
  const [h, m, s = "0"] = time.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const NAIVE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/**
 * naive ISO "YYYY-MM-DDTHH:mm:ss"에서 벽시계 시각만 추출.
 * 오프셋/Z가 붙은 입력은 조용히 틀린 판정(NaN 비교 → 전원 LATE)으로 이어지므로
 * 계약 위반은 즉시 throw한다 — 타임존 변환은 엔진 밖(attendance_range RPC)의 책임이다.
 */
function clockInSecondsOf(clockInAt: string): number {
  if (!NAIVE_ISO_PATTERN.test(clockInAt)) {
    throw new Error(`policy-engine: clockInAt은 오프셋 없는 naive ISO여야 합니다 (받은 값: "${clockInAt}")`);
  }
  return secondsOfDay(clockInAt.slice(11));
}

function nextDayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 하루의 근태 상태를 평가한다.
 *
 * @param record 해당 날짜의 기록 (없으면 null)
 * @param policy 평가에 적용할 정책
 * @param date   평가 대상 날짜 "YYYY-MM-DD"
 * @param today  기준 날짜 "YYYY-MM-DD" — 엔진은 현재 시각을 스스로 알지 않는다
 * @returns 상태, 또는 null(평가 대상 아님 — 주말, 완결되지 않은 오늘/미래)
 */
export function evaluateDay(
  record: DayRecord | null,
  policy: Policy,
  date: string,
  today: string,
): AttendanceStatus | null {
  if (isWeekend(date)) return null;
  if (record?.kind === "LEAVE") return "LEAVE";
  // 미래는 평가하지 않는다 — 출근 기록이 있어도(데이터 오염) 상태를 만들지 않음
  if (date > today) return null;

  const clockInAt = record?.clockInAt ?? null;
  if (clockInAt === null) {
    // 어제까지의 완결된 날만 ABSENT — 오늘/미래는 아직 출근 전일 수 있다
    return date < today ? "ABSENT" : null;
  }

  switch (policy.type) {
    case "AUTONOMOUS":
      return "ON_TIME";
    case "CORE_TIME":
      return clockInSecondsOf(clockInAt) <= secondsOfDay(policy.coreStart) ? "ON_TIME" : "LATE";
    case "FIXED":
      return clockInSecondsOf(clockInAt) <= secondsOfDay(policy.workStart) + policy.graceMinutes * 60
        ? "ON_TIME"
        : "LATE";
  }
}

/**
 * [from, to] 구간의 일별 평가. 같은 입력이면 항상 같은 출력 (순수 함수).
 * 같은 날짜에 WORK와 LEAVE 기록이 모두 있으면 LEAVE가 우선한다.
 */
export function evaluateRange(
  records: DayRecord[],
  policy: Policy,
  from: string,
  to: string,
  today: string,
): DailyEvaluation[] {
  const byDate = new Map<string, DayRecord>();
  for (const record of records) {
    const existing = byDate.get(record.date);
    if (!existing || (record.kind === "LEAVE" && existing.kind !== "LEAVE")) {
      byDate.set(record.date, record);
    }
  }

  const result: DailyEvaluation[] = [];
  for (let date = from; date <= to; date = nextDayOf(date)) {
    result.push({ date, status: evaluateDay(byDate.get(date) ?? null, policy, date, today) });
  }
  return result;
}
