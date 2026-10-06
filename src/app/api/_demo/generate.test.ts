import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS, DEMO_PEOPLE } from "./data";
import { HISTORY_DAYS, addDays, generateDemoAttendance, hiredOnOf, policyOf } from "./generate";

const TODAY = "2026-10-06"; // 화요일
const NOW = "13:00:00";
const { records, leaves } = generateDemoAttendance(TODAY, NOW);
const isWeekend = (date: string) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

describe("데모 근태 생성", () => {
  it("같은 날짜·시각이면 항상 같은 결과 (다시 실행해도 같은 데이터)", () => {
    expect(generateDemoAttendance(TODAY, NOW)).toEqual({ records, leaves });
  });

  it("30명, 최근 3개월 평일 기록", () => {
    expect(DEMO_PEOPLE).toHaveLength(30);
    expect(new Set(records.map((r) => r.local)).size).toBe(30);
    expect(records.every((r) => !isWeekend(r.date))).toBe(true);
    expect(records.every((r) => r.date >= addDays(TODAY, -HISTORY_DAYS) && r.date <= TODAY)).toBe(true);
    expect(records.length).toBeGreaterThan(1500);
  });

  it("입사 전에는 기록이 없다", () => {
    for (const person of DEMO_PEOPLE) {
      const hiredOn = hiredOnOf(person, TODAY);
      expect(records.filter((r) => r.local === person.local).every((r) => r.date >= hiredOn)).toBe(true);
    }
  });

  it("사람·날짜당 하나, 승인된 휴가 날에는 출근 기록이 없다", () => {
    const keys = records.map((r) => `${r.local}:${r.date}`);
    expect(new Set(keys).size).toBe(keys.length);
    const approved = new Set(leaves.filter((l) => l.status === "APPROVED").map((l) => `${l.local}:${l.date}`));
    expect(keys.some((k) => approved.has(k))).toBe(false);
  });

  it("코어타임 팀의 지각은 10:00 이후, 정상은 10:00 이전 (엔진 경계와 맞음)", () => {
    const core = records.filter((r) => policyOf(DEMO_PEOPLE.find((p) => p.local === r.local)!) === "CORE");
    expect(core.some((r) => r.clockIn > "10:00:59")).toBe(true);
    expect(core.every((r) => r.clockIn <= "09:58:59" || r.clockIn >= "10:03:00")).toBe(true);
  });

  it("오늘: 지금보다 이른 출근만, 퇴근 없음. 데모 로그인 계정은 비워 둔다", () => {
    const today = records.filter((r) => r.date === TODAY);
    expect(today.length).toBeGreaterThan(10);
    expect(today.every((r) => r.clockIn < NOW && r.clockOut === null)).toBe(true);
    expect(today.some((r) => (Object.values(DEMO_ACCOUNTS) as string[]).includes(r.local))).toBe(false);
  });

  it("앞으로의 대기 휴가와 데모 팀장 화면의 겹침", () => {
    const pending = leaves.filter((l) => l.status === "PENDING");
    expect(pending.every((l) => l.date > TODAY && l.decidedByLocal === null)).toBe(true);
    const employeeLeave = pending.find((l) => l.local === DEMO_ACCOUNTS.employee)!;
    expect(pending.some((l) => l.local === "doyun.choi" && l.date === employeeLeave.date)).toBe(true);
    expect(leaves.filter((l) => l.status !== "PENDING").every((l) => l.decidedByLocal && l.createdOn <= l.date)).toBe(
      true,
    );
  });

  it("주말에는 오늘 기록이 없다", () => {
    expect(generateDemoAttendance("2026-10-10", "13:00:00").records.some((r) => r.date === "2026-10-10")).toBe(false);
  });
});
