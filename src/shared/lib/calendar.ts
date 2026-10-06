/**
 * 월 달력용 날짜 계산. 날짜는 모두 "YYYY-MM-DD", 월은 "YYYY-MM" 문자열이다.
 * UTC로 고정해 파싱하므로 실행 환경의 타임존과 무관하게 같은 결과가 나온다.
 * "오늘"은 인자로 받는다 (근태 화면은 서버가 준 KST 날짜를 쓴다).
 */

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export interface CalendarDay {
  date: string;
  day: number;
  /** 0 = 일요일 … 6 = 토요일 */
  dayOfWeek: number;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
}

const parse = (date: string) => new Date(`${date}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);

export const toMonthKey = (date: string) => date.slice(0, 7);

/** "2026-10" + 1 → "2026-11" */
export const shiftMonth = (month: string, delta: number) => {
  const d = parse(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return toMonthKey(format(d));
};

/** 그 달의 첫날과 마지막 날 */
export const monthRange = (month: string) => {
  const first = parse(`${month}-01`);
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return { from: format(first), to: format(last) };
};

export const weekdayLabel = (dayOfWeek: number) => WEEKDAY_LABELS[dayOfWeek];

/** 표시할 요일 머리글. 평일만 보기면 월~금 */
export const weekdayHeaders = (weekdaysOnly = false) =>
  (weekdaysOnly ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]).map((dayOfWeek) => ({
    dayOfWeek,
    label: WEEKDAY_LABELS[dayOfWeek],
  }));

/**
 * 달력 칸 목록. 첫 주의 앞자리는 null로 채운다 (마지막 주 뒷자리는 채우지 않는다).
 * 평일만 보기면 주말 칸을 빼고 월요일부터 시작한다.
 */
export const buildMonthGrid = (month: string, today: string, { weekdaysOnly = false } = {}) => {
  const { from, to } = monthRange(month);
  const cells: (CalendarDay | null)[] = [];

  const firstDayOfWeek = parse(from).getUTCDay();
  const leading = weekdaysOnly
    ? firstDayOfWeek === 0 || firstDayOfWeek === 6
      ? 0
      : firstDayOfWeek - 1
    : firstDayOfWeek;
  for (let i = 0; i < leading; i++) cells.push(null);

  for (let d = parse(from); format(d) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = format(d);
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (weekdaysOnly && isWeekend) continue;
    cells.push({ date, day: d.getUTCDate(), dayOfWeek, isWeekend, isToday: date === today, isPast: date < today });
  }
  return cells;
};

/** "2026-10" → "2026년 10월" */
export const formatMonthLabel = (month: string) => {
  const [year, m] = month.split("-");
  return `${year}년 ${Number(m)}월`;
};

/** "2026-10-23" → "10월 23일 (금)" */
export const formatDayLabel = (date: string) => {
  const d = parse(date);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAY_LABELS[d.getUTCDay()]})`;
};
