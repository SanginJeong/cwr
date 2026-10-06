import { DEMO_ACCOUNTS, DEMO_PEOPLE, DEMO_TEAMS, type DemoPerson, type DemoPolicyKey } from "./data";

/**
 * 데모 근태 기록 생성. 순수 함수라 같은 (today, nowTime)이면 항상 같은 결과가 나온다 (멱등).
 * 날짜는 KST "YYYY-MM-DD", 시각은 KST 벽시계 "HH:MM:SS".
 */

export const HISTORY_DAYS = 92;

export interface DemoRecord {
  local: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
}

export interface DemoLeave {
  local: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  decidedByLocal: string | null;
  /** 신청한 날 (KST) */
  createdOn: string;
}

// ── 날짜 ──
const parse = (date: string) => new Date(`${date}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
};
const isWeekend = (date: string) => [0, 6].includes(parse(date).getUTCDay());
/** date 다음부터 n번째 평일 */
const weekdayAfter = (date: string, n: number) => {
  let d = date;
  for (let k = 0; k < n; ) {
    d = addDays(d, 1);
    if (!isWeekend(d)) k++;
  }
  return d;
};

// ── 결정적 난수 (seed 문자열 → 0~1) ──
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const random = (seed: string) => {
  let t = hash(seed) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (seed: string, min: number, max: number) => min + Math.floor(random(seed) * (max - min + 1));

const toTime = (minutes: number, seconds: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

/** 정책별 출근 시각 범위(분). 정상은 판정 경계 안, 지각은 밖 (엔진: 경계 이하면 정상) */
const CLOCK_IN_RANGE: Record<DemoPolicyKey, { onTime: [number, number]; late: [number, number] }> = {
  CORE: { onTime: [8 * 60 + 30, 9 * 60 + 58], late: [10 * 60 + 3, 11 * 60 + 15] },
  FIXED: { onTime: [8 * 60 + 15, 9 * 60 + 9], late: [9 * 60 + 12, 10 * 60 + 5] },
  AUTO: { onTime: [7 * 60 + 40, 11 * 60], late: [7 * 60 + 40, 11 * 60] },
};

export const policyOf = (person: DemoPerson): DemoPolicyKey =>
  person.isHrAdmin ? "FIXED" : (DEMO_TEAMS.find((t) => t.name === person.team)?.policy ?? "AUTO");

export const hiredOnOf = (person: DemoPerson, today: string) => addDays(today, -(person.hiredDaysAgo ?? 400));

const leaderOf = (person: DemoPerson) =>
  person.isLeader || !person.team
    ? DEMO_ACCOUNTS.hr
    : (DEMO_PEOPLE.find((p) => p.team === person.team && p.isLeader)?.local ?? DEMO_ACCOUNTS.hr);

const REASONS = ["병원", "가족 행사", "이사", "개인 사유", "여행", null];

/**
 * 앞으로의 휴가: 팀장 화면에서 볼 거리(대기, 같은 날 겹침, 팀장 본인 휴가)를 일부러 만든다.
 * 박지민(데모 직원)과 최도윤이 같은 날 대기 → 김하늘(데모 팀장)의 승인 화면에 "겹침"
 */
const upcomingLeaves = (today: string): Omit<DemoLeave, "decidedByLocal" | "createdOn">[] => [
  { local: DEMO_ACCOUNTS.employee, date: weekdayAfter(today, 5), status: "PENDING", reason: "가족 행사" },
  { local: "doyun.choi", date: weekdayAfter(today, 5), status: "PENDING", reason: "이사" },
  { local: "yuna.jung", date: weekdayAfter(today, 3), status: "APPROVED", reason: "병원" },
  { local: DEMO_ACCOUNTS.leader, date: weekdayAfter(today, 10), status: "PENDING", reason: "개인 사유" },
  { local: "jiho.seo", date: weekdayAfter(today, 7), status: "PENDING", reason: "여행" },
  { local: "dohyun.kwon", date: weekdayAfter(today, 4), status: "PENDING", reason: null },
  { local: "eunchae.ko", date: weekdayAfter(today, 8), status: "PENDING", reason: "병원" },
  { local: "seoyun.baek", date: weekdayAfter(today, 8), status: "APPROVED", reason: "가족 행사" },
];

export const generateDemoAttendance = (today: string, nowTime: string) => {
  const from = addDays(today, -HISTORY_DAYS);
  const records: DemoRecord[] = [];
  const leaves: DemoLeave[] = [];

  for (const person of DEMO_PEOPLE) {
    const hiredOn = hiredOnOf(person, today);
    const start = hiredOn > from ? hiredOn : from;
    const pastWeekdays: string[] = [];
    for (let d = start; d < today; d = addDays(d, 1)) if (!isWeekend(d)) pastWeekdays.push(d);

    // 지난 휴가: 승인 0~2건, 가끔 반려 1건
    const leaveDays = new Set<string>();
    const approvedCount = pastWeekdays.length < 20 ? 0 : between(`${person.local}:leaves`, 0, 2);
    for (let i = 0; i < approvedCount; i++) {
      const date = pastWeekdays[between(`${person.local}:leave:${i}`, 0, pastWeekdays.length - 1)];
      if (leaveDays.has(date)) continue;
      leaveDays.add(date);
      leaves.push({
        local: person.local,
        date,
        status: "APPROVED",
        reason: REASONS[between(`${person.local}:reason:${i}`, 0, REASONS.length - 1)],
        decidedByLocal: leaderOf(person),
        createdOn: addDays(date, -between(`${person.local}:ahead:${i}`, 3, 14)),
      });
    }
    if (pastWeekdays.length >= 20 && random(`${person.local}:rejected`) < 0.2) {
      const date = pastWeekdays[between(`${person.local}:rejected:date`, 0, pastWeekdays.length - 1)];
      if (!leaveDays.has(date)) {
        leaves.push({
          local: person.local,
          date,
          status: "REJECTED",
          reason: "개인 사유",
          decidedByLocal: leaderOf(person),
          createdOn: addDays(date, -5),
        });
      }
    }

    // 지난 출퇴근: 결근이면 기록 없음, 아니면 정상·지각 시각
    const policy = policyOf(person);
    for (const date of pastWeekdays) {
      if (leaveDays.has(date)) continue;
      const seed = `${person.local}:${date}`;
      if (random(`${seed}:absent`) < (person.absentRate ?? 0.02)) continue;
      const isLate = random(`${seed}:late`) < (person.lateRate ?? 0.08);
      const [min, max] = CLOCK_IN_RANGE[policy][isLate ? "late" : "onTime"];
      const inMinutes = between(`${seed}:in`, min, max);
      const outMinutes = Math.min(inMinutes + between(`${seed}:work`, 510, 600), 23 * 60 + 50);
      records.push({
        local: person.local,
        date,
        clockIn: toTime(inMinutes, between(`${seed}:in:s`, 0, 59)),
        clockOut: toTime(outMinutes, between(`${seed}:out:s`, 0, 59)),
      });
    }

    // 오늘: 지금 시각보다 이른 출근만, 퇴근은 아직. 데모 로그인 계정은 직접 출근해 볼 수 있게 비워 둔다
    const isDemoAccount = (Object.values(DEMO_ACCOUNTS) as string[]).includes(person.local);
    if (!isDemoAccount && !isWeekend(today) && today >= hiredOn && random(`${person.local}:${today}:today`) < 0.8) {
      const isLate = random(`${person.local}:${today}:late`) < (person.lateRate ?? 0.08);
      const [min, max] = CLOCK_IN_RANGE[policy][isLate ? "late" : "onTime"];
      const inMinutes = between(`${person.local}:${today}:in`, min, max);
      const time = toTime(inMinutes, between(`${person.local}:${today}:in:s`, 0, 59));
      if (time < nowTime) records.push({ local: person.local, date: today, clockIn: time, clockOut: null });
    }
  }

  for (const leave of upcomingLeaves(today)) {
    const person = DEMO_PEOPLE.find((p) => p.local === leave.local)!;
    leaves.push({
      ...leave,
      decidedByLocal: leave.status === "PENDING" ? null : leaderOf(person),
      createdOn: addDays(today, -between(`${leave.local}:upcoming`, 0, 3)),
    });
  }

  return { records, leaves };
};
