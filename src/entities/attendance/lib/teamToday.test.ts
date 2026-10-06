import { describe, expect, it } from "vitest";
import { getMemberToday, summarizeTeamToday } from "./teamToday";
import type { TeamMemberAttendance } from "../model/types";

const TODAY = "2026-10-06"; // 화요일
const base = {
  hiredOn: "2026-01-01",
  policy: { id: 2, name: "9시 고정", isDefault: false, type: "FIXED" as const, workStart: "09:00", graceMinutes: 10 },
};
const member = (userId: number, records: TeamMemberAttendance["records"], extra = {}) => ({
  userId,
  records,
  ...base,
  ...extra,
});

describe("getMemberToday", () => {
  it("출근 시각으로 정상·지각", () => {
    expect(
      getMemberToday(
        member(1, [{ date: TODAY, kind: "WORK", clockInAt: `${TODAY}T08:51:00`, clockOutAt: null }]),
        TODAY,
      ),
    ).toEqual({ userId: 1, kind: "ON_TIME", clockInAt: `${TODAY}T08:51:00`, clockOutAt: null });
    expect(
      getMemberToday(
        member(2, [{ date: TODAY, kind: "WORK", clockInAt: `${TODAY}T10:24:00`, clockOutAt: null }]),
        TODAY,
      ).kind,
    ).toBe("LATE");
  });

  it("승인된 휴가는 휴가, 기록이 없으면 미출근", () => {
    expect(
      getMemberToday(member(3, [{ date: TODAY, kind: "LEAVE", clockInAt: null, clockOutAt: null }]), TODAY).kind,
    ).toBe("LEAVE");
    expect(getMemberToday(member(4, []), TODAY).kind).toBe("NOT_YET");
  });

  it("주말과 입사 전은 표시하지 않음 (null)", () => {
    expect(getMemberToday(member(5, []), "2026-10-10").kind).toBeNull();
    expect(getMemberToday(member(6, [], { hiredOn: "2026-10-07" }), TODAY).kind).toBeNull();
  });
});

describe("summarizeTeamToday", () => {
  it("상태별 인원, 표시하지 않는 사람은 빼고", () => {
    expect(
      summarizeTeamToday([
        { userId: 1, kind: "ON_TIME", clockInAt: null, clockOutAt: null },
        { userId: 2, kind: "ON_TIME", clockInAt: null, clockOutAt: null },
        { userId: 3, kind: "NOT_YET", clockInAt: null, clockOutAt: null },
        { userId: 4, kind: null, clockInAt: null, clockOutAt: null },
      ]),
    ).toEqual({ ON_TIME: 2, LATE: 0, LEAVE: 0, NOT_YET: 1 });
  });
});
