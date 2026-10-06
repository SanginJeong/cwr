import { describe, expect, it } from "vitest";
import { evaluateDay, evaluateRange } from "./index";
import type { DayRecord, Policy } from "./types";

// 2026-06-01 = 월요일. 주중/주말 날짜를 고정해두고 사용한다.
const MON = "2026-06-01";
const TUE = "2026-06-02";
const SAT = "2026-06-06";
const SUN = "2026-06-07";
const TODAY = "2026-06-15"; // 월요일
const FUTURE = "2026-06-22";

const AUTONOMOUS: Policy = { type: "AUTONOMOUS" };
const CORE: Policy = { type: "CORE_TIME", coreStart: "10:00", coreEnd: "16:00" };
const FIXED: Policy = { type: "FIXED", workStart: "09:00", graceMinutes: 10 };

function work(date: string, clockIn: string | null, clockOut: string | null = null): DayRecord {
  return {
    date,
    kind: "WORK",
    clockInAt: clockIn ? `${date}T${clockIn}` : null,
    clockOutAt: clockOut ? `${date}T${clockOut}` : null,
  };
}

function leave(date: string): DayRecord {
  return { date, kind: "LEAVE", clockInAt: null, clockOutAt: null };
}

describe("주말 — 평가 대상 아님", () => {
  it("토요일은 기록이 있어도 null", () => {
    expect(evaluateDay(work(SAT, "09:00:00"), FIXED, SAT, TODAY)).toBeNull();
  });
  it("일요일은 LEAVE 기록이 있어도 null", () => {
    expect(evaluateDay(leave(SUN), FIXED, SUN, TODAY)).toBeNull();
  });
  it("주말에 기록이 없어도 ABSENT가 아니라 null", () => {
    expect(evaluateDay(null, AUTONOMOUS, SAT, TODAY)).toBeNull();
  });
});

describe("LEAVE 우선", () => {
  it("과거 근무일의 LEAVE 기록은 LEAVE", () => {
    expect(evaluateDay(leave(MON), FIXED, MON, TODAY)).toBe("LEAVE");
  });
  it("미래 근무일의 승인된 휴가도 LEAVE (달력 표시용)", () => {
    expect(evaluateDay(leave(FUTURE), CORE, FUTURE, TODAY)).toBe("LEAVE");
  });
  it("오늘의 LEAVE도 LEAVE", () => {
    expect(evaluateDay(leave(TODAY), AUTONOMOUS, TODAY, TODAY)).toBe("LEAVE");
  });
});

describe("기록 없는 날", () => {
  it("과거 근무일 + 기록 없음 = ABSENT (AUTONOMOUS 포함 모든 정책)", () => {
    expect(evaluateDay(null, AUTONOMOUS, MON, TODAY)).toBe("ABSENT");
    expect(evaluateDay(null, CORE, MON, TODAY)).toBe("ABSENT");
    expect(evaluateDay(null, FIXED, MON, TODAY)).toBe("ABSENT");
  });
  it("오늘 + 기록 없음 = null (아직 출근 전일 수 있음)", () => {
    expect(evaluateDay(null, FIXED, TODAY, TODAY)).toBeNull();
  });
  it("미래 + 기록 없음 = null", () => {
    expect(evaluateDay(null, FIXED, FUTURE, TODAY)).toBeNull();
  });
  it("바로 어제(완결된 첫 날)부터 ABSENT 가능", () => {
    // 화요일을 기준일로 — 어제(월)는 근무일
    expect(evaluateDay(null, FIXED, "2026-06-01", "2026-06-02")).toBe("ABSENT");
  });
  it("WORK 기록은 있으나 clockInAt이 null이면 기록 없음과 동일", () => {
    expect(evaluateDay(work(MON, null), FIXED, MON, TODAY)).toBe("ABSENT");
    expect(evaluateDay(work(TODAY, null), FIXED, TODAY, TODAY)).toBeNull();
  });
});

describe("AUTONOMOUS", () => {
  it("출근 기록만 있으면 시각과 무관하게 ON_TIME", () => {
    expect(evaluateDay(work(MON, "04:30:00"), AUTONOMOUS, MON, TODAY)).toBe("ON_TIME");
    expect(evaluateDay(work(MON, "15:59:00"), AUTONOMOUS, MON, TODAY)).toBe("ON_TIME");
  });
});

describe("CORE_TIME — coreStart 이전/정각 출근이면 ON_TIME", () => {
  it("coreStart 이전 출근 = ON_TIME", () => {
    expect(evaluateDay(work(MON, "08:12:00"), CORE, MON, TODAY)).toBe("ON_TIME");
  });
  it("coreStart 정각(10:00:00) = ON_TIME (경계)", () => {
    expect(evaluateDay(work(MON, "10:00:00"), CORE, MON, TODAY)).toBe("ON_TIME");
  });
  it("coreStart 1초 초과(10:00:01) = LATE (경계)", () => {
    expect(evaluateDay(work(MON, "10:00:01"), CORE, MON, TODAY)).toBe("LATE");
  });
  it("coreStart 한참 뒤 출근 = LATE", () => {
    expect(evaluateDay(work(MON, "11:30:00"), CORE, MON, TODAY)).toBe("LATE");
  });
});

describe("FIXED — workStart + graceMinutes까지 ON_TIME", () => {
  it("workStart 이전 = ON_TIME", () => {
    expect(evaluateDay(work(MON, "08:55:00"), FIXED, MON, TODAY)).toBe("ON_TIME");
  });
  it("유예 정확히 소진(09:10:00) = ON_TIME (경계)", () => {
    expect(evaluateDay(work(MON, "09:10:00"), FIXED, MON, TODAY)).toBe("ON_TIME");
  });
  it("유예 1초 초과(09:10:01) = LATE (경계)", () => {
    expect(evaluateDay(work(MON, "09:10:01"), FIXED, MON, TODAY)).toBe("LATE");
  });
  it("graceMinutes 0이면 workStart 정각까지만 ON_TIME", () => {
    const strict: Policy = { type: "FIXED", workStart: "09:00", graceMinutes: 0 };
    expect(evaluateDay(work(MON, "09:00:00"), strict, MON, TODAY)).toBe("ON_TIME");
    expect(evaluateDay(work(MON, "09:00:01"), strict, MON, TODAY)).toBe("LATE");
  });
});

describe("자정 근처 (KST 벽시계 기준)", () => {
  it("자정 직후(00:00:30) 출근은 그 날짜의 이른 출근", () => {
    expect(evaluateDay(work(MON, "00:00:30"), FIXED, MON, TODAY)).toBe("ON_TIME");
    expect(evaluateDay(work(MON, "00:00:30"), CORE, MON, TODAY)).toBe("ON_TIME");
  });
  it("자정 직전(23:59:59) 출근은 LATE (AUTONOMOUS는 ON_TIME)", () => {
    expect(evaluateDay(work(MON, "23:59:59"), FIXED, MON, TODAY)).toBe("LATE");
    expect(evaluateDay(work(MON, "23:59:59"), CORE, MON, TODAY)).toBe("LATE");
    expect(evaluateDay(work(MON, "23:59:59"), AUTONOMOUS, MON, TODAY)).toBe("ON_TIME");
  });
  it("유예가 자정을 넘는 FIXED(23:30 + 60분)도 같은 날 안에서만 비교한다", () => {
    const night: Policy = { type: "FIXED", workStart: "23:30", graceMinutes: 60 };
    expect(evaluateDay(work(MON, "23:59:59"), night, MON, TODAY)).toBe("ON_TIME");
  });
});

describe("오늘 날짜의 평가", () => {
  it("오늘 이미 출근했다면 정상 평가된다", () => {
    expect(evaluateDay(work(TODAY, "09:05:00"), FIXED, TODAY, TODAY)).toBe("ON_TIME");
    expect(evaluateDay(work(TODAY, "09:20:00"), FIXED, TODAY, TODAY)).toBe("LATE");
  });
});

describe("입력 계약 위반 — fail fast (리뷰 Required 회귀 테스트)", () => {
  it("오프셋 포함 clockInAt은 조용히 LATE가 되지 않고 throw한다", () => {
    const record: DayRecord = {
      date: MON,
      kind: "WORK",
      clockInAt: `${MON}T09:00:00+09:00`,
      clockOutAt: null,
    };
    expect(() => evaluateDay(record, FIXED, MON, TODAY)).toThrow(/naive ISO/);
  });
  it("Z(UTC) 표기도 계약 위반으로 throw한다", () => {
    const record: DayRecord = {
      date: MON,
      kind: "WORK",
      clockInAt: `${MON}T09:00:00Z`,
      clockOutAt: null,
    };
    expect(() => evaluateDay(record, FIXED, MON, TODAY)).toThrow(/naive ISO/);
  });
  it("초 없는 naive ISO(HH:mm)는 허용한다", () => {
    const record: DayRecord = {
      date: MON,
      kind: "WORK",
      clockInAt: `${MON}T09:00`,
      clockOutAt: null,
    };
    expect(evaluateDay(record, FIXED, MON, TODAY)).toBe("ON_TIME");
  });
});

describe("미래 날짜 가드 (리뷰 Consider 반영)", () => {
  it("미래 날짜는 출근 기록이 있어도(데이터 오염) 평가하지 않는다", () => {
    expect(evaluateDay(work(FUTURE, "09:00:00"), FIXED, FUTURE, TODAY)).toBeNull();
    expect(evaluateDay(work(FUTURE, "09:00:00"), AUTONOMOUS, FUTURE, TODAY)).toBeNull();
  });
  it("미래의 승인된 휴가는 여전히 LEAVE (달력 표시용 — 가드보다 우선)", () => {
    expect(evaluateDay(leave(FUTURE), FIXED, FUTURE, TODAY)).toBe("LEAVE");
  });
});

describe("evaluateRange", () => {
  it("한 주(월~일)를 평가하면 주말은 null, 근무일은 상태가 나온다", () => {
    const records = [
      work(MON, "08:50:00"), // ON_TIME
      work(TUE, "09:30:00"), // LATE
      leave("2026-06-03"), // LEAVE
      // 06-04(목): 기록 없음 → ABSENT
      work("2026-06-05", "09:00:00"), // ON_TIME
    ];
    const result = evaluateRange(records, FIXED, MON, SUN, TODAY);
    expect(result).toEqual([
      { date: "2026-06-01", status: "ON_TIME" },
      { date: "2026-06-02", status: "LATE" },
      { date: "2026-06-03", status: "LEAVE" },
      { date: "2026-06-04", status: "ABSENT" },
      { date: "2026-06-05", status: "ON_TIME" },
      { date: "2026-06-06", status: null },
      { date: "2026-06-07", status: null },
    ]);
  });

  it("같은 날짜에 WORK와 LEAVE가 모두 있으면 배열 순서와 무관하게 LEAVE 우선", () => {
    const records = [work(MON, "09:00:00"), leave(MON)];
    expect(evaluateRange(records, FIXED, MON, MON, TODAY)).toEqual([{ date: MON, status: "LEAVE" }]);
    expect(evaluateRange(records.slice().reverse(), FIXED, MON, MON, TODAY)).toEqual([{ date: MON, status: "LEAVE" }]);
  });

  it("범위 밖 기록은 무시한다", () => {
    const records = [work("2026-05-29", "09:00:00")];
    expect(evaluateRange(records, FIXED, MON, MON, TODAY)).toEqual([{ date: MON, status: "ABSENT" }]);
  });

  it("오늘을 포함한 구간: 기록 없는 오늘은 null, 미래도 null", () => {
    const result = evaluateRange([], FIXED, "2026-06-12", "2026-06-16", TODAY);
    expect(result).toEqual([
      { date: "2026-06-12", status: "ABSENT" }, // 금요일, 과거
      { date: "2026-06-13", status: null }, // 토
      { date: "2026-06-14", status: null }, // 일
      { date: "2026-06-15", status: null }, // 오늘, 기록 없음
      { date: "2026-06-16", status: null }, // 미래
    ]);
  });

  it("from > to면 빈 배열", () => {
    expect(evaluateRange([], FIXED, TUE, MON, TODAY)).toEqual([]);
  });

  it("순수 함수: 같은 입력이면 같은 출력, 입력 배열을 변형하지 않는다", () => {
    const records = [work(MON, "09:05:00"), leave(TUE)];
    const snapshot = structuredClone(records);
    const a = evaluateRange(records, FIXED, MON, SUN, TODAY);
    const b = evaluateRange(records, FIXED, MON, SUN, TODAY);
    expect(a).toEqual(b);
    expect(records).toEqual(snapshot);
  });

  it("윤년 2월 경계(2024-02-29)를 올바르게 생성한다", () => {
    const result = evaluateRange([], FIXED, "2024-02-28", "2024-03-01", TODAY);
    expect(result.map((r) => r.date)).toEqual(["2024-02-28", "2024-02-29", "2024-03-01"]);
  });

  it("월 경계를 넘는 구간도 정상 동작", () => {
    const result = evaluateRange([], FIXED, "2026-05-29", "2026-06-01", TODAY);
    expect(result).toEqual([
      { date: "2026-05-29", status: "ABSENT" }, // 금
      { date: "2026-05-30", status: null }, // 토
      { date: "2026-05-31", status: null }, // 일
      { date: "2026-06-01", status: "ABSENT" }, // 월 — 기록 없음
    ]);
  });
});
