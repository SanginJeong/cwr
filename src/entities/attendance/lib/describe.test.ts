import { describe, expect, it } from "vitest";
import {
  describePolicy,
  evaluateToday,
  formatClockTime,
  formatDuration,
  getClockState,
  nowKstNaiveIso,
  workedMinutes,
} from "./describe";

describe("describePolicy", () => {
  it("유형별 문장", () => {
    expect(describePolicy({ type: "AUTONOMOUS" })).toEqual({
      typeLabel: "자율 출퇴근",
      hours: null,
      rule: "출근 기록만 있으면 정상",
    });
    expect(describePolicy({ type: "CORE_TIME", coreStart: "10:00", coreEnd: "16:00" })).toEqual({
      typeLabel: "코어타임",
      hours: "10:00–16:00",
      rule: "10:00까지 출근하면 정상",
    });
  });
  it("고정 근무는 유예를 더한 시각으로 (엔진과 같은 경계)", () => {
    expect(describePolicy({ type: "FIXED", workStart: "09:00", graceMinutes: 10 }).rule).toBe(
      "09:10까지 출근하면 정상 (유예 10분)",
    );
    expect(describePolicy({ type: "FIXED", workStart: "09:50", graceMinutes: 15 }).rule).toBe(
      "10:05까지 출근하면 정상 (유예 15분)",
    );
    expect(describePolicy({ type: "FIXED", workStart: "09:00", graceMinutes: 0 }).rule).toBe("09:00까지 출근하면 정상");
  });
});

describe("출퇴근 카드", () => {
  it("상태: 출근 전 / 근무 중 / 퇴근 완료", () => {
    expect(getClockState(null)).toBe("BEFORE");
    expect(getClockState({ clockInAt: "2026-10-06T09:02:00", clockOutAt: null })).toBe("WORKING");
    expect(getClockState({ clockInAt: "2026-10-06T09:02:00", clockOutAt: "2026-10-06T18:33:00" })).toBe("DONE");
  });

  it("시각과 근무 시간", () => {
    expect(formatClockTime("2026-10-06T09:02:41")).toBe("09:02");
    expect(formatClockTime(null)).toBe("--:--");
    expect(workedMinutes("2026-10-06T09:02:00", null, "2026-10-06T13:14:59")).toBe(252);
    expect(workedMinutes("2026-10-06T09:02:00", "2026-10-06T18:33:00", "2026-10-06T23:00:00")).toBe(571);
    expect(workedMinutes("2026-10-06T09:02:00", null, "2026-10-06T09:00:00")).toBe(0);
    expect(formatDuration(252)).toBe("4시간 12분");
    expect(formatDuration(45)).toBe("45분");
  });

  it("지금의 KST 시각 (UTC + 9시간)", () => {
    expect(nowKstNaiveIso(new Date("2026-10-06T15:30:00Z"))).toBe("2026-10-07T00:30:00");
  });

  it("오늘 판정은 출근했을 때만", () => {
    const fixed = { type: "FIXED" as const, workStart: "09:00", graceMinutes: 10 };
    expect(evaluateToday(null, fixed, "2026-10-06")).toBeNull();
    const record = { date: "2026-10-06", kind: "WORK" as const, clockInAt: "2026-10-06T09:20:00", clockOutAt: null };
    expect(evaluateToday(record, fixed, "2026-10-06")).toBe("LATE");
  });
});
