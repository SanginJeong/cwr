import { describe, expect, it } from "vitest";
import { buildMonthGrid, formatDayLabel, formatMonthLabel, monthRange, shiftMonth, weekdayHeaders } from "./calendar";

// 2026-10-01 = 목요일, 2026-11-01 = 일요일, 2026-08-01 = 토요일
describe("shiftMonth", () => {
  it("다음 달·이전 달, 연도 경계", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("31일이 있는 달에서도 한 달씩만 움직인다 (1일 기준)", () => {
    expect(shiftMonth("2026-01", 1)).toBe("2026-02");
  });
});

describe("monthRange", () => {
  it("말일을 맞게 계산한다 (윤년 포함)", () => {
    expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("buildMonthGrid", () => {
  it("첫 주 앞자리를 요일만큼 비운다 (10월 1일 목요일 → 4칸)", () => {
    const grid = buildMonthGrid("2026-10", "2026-10-06");
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toMatchObject({ date: "2026-10-01", day: 1, dayOfWeek: 4, isWeekend: false });
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it("오늘과 지난 날을 표시한다", () => {
    const days = buildMonthGrid("2026-10", "2026-10-06").filter((d) => d !== null);
    expect(days.find((d) => d.date === "2026-10-06")).toMatchObject({ isToday: true, isPast: false });
    expect(days.find((d) => d.date === "2026-10-05")).toMatchObject({ isToday: false, isPast: true });
    expect(days.find((d) => d.date === "2026-10-07")).toMatchObject({ isToday: false, isPast: false });
  });

  it("평일만 보기: 주말을 빼고 월요일 기준으로 앞자리를 비운다", () => {
    const grid = buildMonthGrid("2026-10", "2026-10-06", { weekdaysOnly: true });
    expect(grid.slice(0, 3)).toEqual([null, null, null]); // 월·화·수 비우고 목요일부터
    expect(grid[3]?.date).toBe("2026-10-01");
    expect(grid.filter(Boolean)).toHaveLength(22);
    expect(grid.some((d) => d?.isWeekend)).toBe(false);
  });

  it("평일만 보기에서 1일이 주말이면 앞자리가 없다", () => {
    const grid = buildMonthGrid("2026-08", "2026-08-03", { weekdaysOnly: true });
    expect(grid[0]?.date).toBe("2026-08-03");
    expect(buildMonthGrid("2026-11", "2026-11-02", { weekdaysOnly: true })[0]?.date).toBe("2026-11-02");
  });
});

describe("라벨", () => {
  it("월과 날짜를 한국어로", () => {
    expect(formatMonthLabel("2026-10")).toBe("2026년 10월");
    expect(formatDayLabel("2026-10-23")).toBe("10월 23일 (금)");
  });
  it("요일 머리글", () => {
    expect(
      weekdayHeaders()
        .map((h) => h.label)
        .join(""),
    ).toBe("일월화수목금토");
    expect(
      weekdayHeaders(true)
        .map((h) => h.label)
        .join(""),
    ).toBe("월화수목금");
  });
});
