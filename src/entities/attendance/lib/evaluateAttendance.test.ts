import { describe, expect, it } from "vitest";
import { evaluateAttendance, summarizeAttendance, toEnginePolicy } from "./evaluateAttendance";
import type { AttendanceRange } from "../model/types";

// attendance_range RPC 응답 예시 (2026-06-01 월 ~ 06-07 일)
const range: AttendanceRange = {
  userId: 1,
  policy: { id: 2, name: "9시 고정", isDefault: false, type: "FIXED", workStart: "09:00", graceMinutes: 10 },
  records: [
    { date: "2026-06-01", kind: "WORK", clockInAt: "2026-06-01T09:05:00", clockOutAt: "2026-06-01T18:00:00" },
    { date: "2026-06-02", kind: "WORK", clockInAt: "2026-06-02T09:30:00", clockOutAt: null },
    { date: "2026-06-03", kind: "LEAVE", clockInAt: null, clockOutAt: null },
  ],
  today: "2026-06-05",
};

describe("toEnginePolicy", () => {
  it("표시용 필드(id, name, isDefault)를 뗀다", () => {
    expect(toEnginePolicy(range.policy)).toEqual({ type: "FIXED", workStart: "09:00", graceMinutes: 10 });
    expect(toEnginePolicy({ id: 1, name: "자율", isDefault: true, type: "AUTONOMOUS" })).toEqual({
      type: "AUTONOMOUS",
    });
    expect(
      toEnginePolicy({
        id: 3,
        name: "코어",
        isDefault: false,
        type: "CORE_TIME",
        coreStart: "10:00",
        coreEnd: "16:00",
      }),
    ).toEqual({ type: "CORE_TIME", coreStart: "10:00", coreEnd: "16:00" });
  });
});

describe("evaluateAttendance", () => {
  it("RPC 응답 그대로 엔진에 넣어 일별 판정을 만든다", () => {
    expect(evaluateAttendance(range, "2026-06-01", "2026-06-07", range.today)).toEqual([
      { date: "2026-06-01", status: "ON_TIME" },
      { date: "2026-06-02", status: "LATE" },
      { date: "2026-06-03", status: "LEAVE" },
      { date: "2026-06-04", status: "ABSENT" },
      { date: "2026-06-05", status: null }, // 오늘, 출근 전
      { date: "2026-06-06", status: null },
      { date: "2026-06-07", status: null },
    ]);
  });

  it("정책만 바꾸면 같은 기록도 다시 판정된다 (판정을 저장하지 않는 이유)", () => {
    const autonomous = { ...range, policy: { id: 1, name: "자율", isDefault: true, type: "AUTONOMOUS" as const } };
    expect(evaluateAttendance(autonomous, "2026-06-02", "2026-06-02", range.today)).toEqual([
      { date: "2026-06-02", status: "ON_TIME" },
    ]);
  });
});

describe("summarizeAttendance", () => {
  it("상태별 일수를 세고 판정 대상이 아닌 날은 뺀다", () => {
    const evaluations = evaluateAttendance(range, "2026-06-01", "2026-06-07", range.today);
    expect(summarizeAttendance(evaluations)).toEqual({ ON_TIME: 1, LATE: 1, ABSENT: 1, LEAVE: 1 });
  });

  it("빈 구간은 모두 0", () => {
    expect(summarizeAttendance([])).toEqual({ ON_TIME: 0, LATE: 0, ABSENT: 0, LEAVE: 0 });
  });
});
