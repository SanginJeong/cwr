/**
 * 데모 회사 (roadmap H6). 직원 30명, 팀 4개, 정책 3종.
 * 이메일 도메인은 예약된 .test라서 실제 메일이 가지 않는다. 데모 계정은 이 도메인으로 구분한다.
 */

export const DEMO_EMAIL_DOMAIN = "coworkers.test";

export const isDemoEmail = (email: string | null | undefined) => !!email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`);

export type DemoPolicyKey = "FIXED" | "CORE" | "AUTO";

/** 정책 이름이 키다. 자율 출퇴근은 기본 정책(마이그레이션 시드)을 쓴다 */
export const DEMO_POLICIES = {
  FIXED: { name: "고정 근무 09:00", type: "FIXED", work_start: "09:00", grace_minutes: 10 },
  CORE: { name: "코어타임 10–16", type: "CORE_TIME", core_start: "10:00", core_end: "16:00" },
} as const;

export const DEMO_TEAMS = [
  { name: "개발팀", policy: "CORE" },
  { name: "디자인팀", policy: "AUTO" },
  { name: "마케팅팀", policy: "FIXED" },
  { name: "영업팀", policy: "FIXED" },
] as const satisfies readonly { name: string; policy: DemoPolicyKey }[];

export type DemoTeamName = (typeof DEMO_TEAMS)[number]["name"];

export interface DemoPerson {
  nickname: string;
  /** @coworkers.test 앞부분 */
  local: string;
  team: DemoTeamName | null;
  isLeader?: boolean;
  isHrAdmin?: boolean;
  /** 지각 확률 (기본 0.08) */
  lateRate?: number;
  /** 결근 확률 (기본 0.02) */
  absentRate?: number;
  /** 입사 며칠 전 (기본 400일 = 3개월 기록 전체) */
  hiredDaysAgo?: number;
}

/** 원클릭 데모 로그인 계정 */
export const DEMO_ACCOUNTS = {
  hr: "hr",
  leader: "leader",
  employee: "employee",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export const demoEmail = (local: string) => `${local}@${DEMO_EMAIL_DOMAIN}`;

export const DEMO_PEOPLE: DemoPerson[] = [
  { nickname: "이서연", local: DEMO_ACCOUNTS.hr, team: null, isHrAdmin: true },

  { nickname: "김하늘", local: DEMO_ACCOUNTS.leader, team: "개발팀", isLeader: true },
  { nickname: "박지민", local: DEMO_ACCOUNTS.employee, team: "개발팀", lateRate: 0.15 },
  { nickname: "최도윤", local: "doyun.choi", team: "개발팀", lateRate: 0.25 },
  { nickname: "정유나", local: "yuna.jung", team: "개발팀" },
  { nickname: "한서준", local: "seojun.han", team: "개발팀" },
  { nickname: "오민재", local: "minjae.oh", team: "개발팀", absentRate: 0.06 },
  { nickname: "윤가은", local: "gaeun.yoon", team: "개발팀", hiredDaysAgo: 18 },
  { nickname: "강태오", local: "taeo.kang", team: "개발팀" },

  { nickname: "문채원", local: "chaewon.moon", team: "디자인팀", isLeader: true },
  { nickname: "서지호", local: "jiho.seo", team: "디자인팀" },
  { nickname: "임하린", local: "harin.lim", team: "디자인팀" },
  { nickname: "배수아", local: "sua.bae", team: "디자인팀" },
  { nickname: "신우진", local: "woojin.shin", team: "디자인팀" },
  { nickname: "조은솔", local: "eunsol.cho", team: "디자인팀", hiredDaysAgo: 45 },

  { nickname: "장민서", local: "minseo.jang", team: "마케팅팀", isLeader: true },
  { nickname: "권도현", local: "dohyun.kwon", team: "마케팅팀", lateRate: 0.18 },
  { nickname: "황예린", local: "yerin.hwang", team: "마케팅팀" },
  { nickname: "송지안", local: "jian.song", team: "마케팅팀" },
  { nickname: "류시우", local: "siwoo.ryu", team: "마케팅팀", absentRate: 0.05 },
  { nickname: "안다인", local: "dain.ahn", team: "마케팅팀" },
  { nickname: "전하율", local: "hayul.jeon", team: "마케팅팀" },

  { nickname: "홍준기", local: "junki.hong", team: "영업팀", isLeader: true },
  { nickname: "고은채", local: "eunchae.ko", team: "영업팀" },
  { nickname: "남궁민", local: "min.namgoong", team: "영업팀", lateRate: 0.2 },
  { nickname: "백서윤", local: "seoyun.baek", team: "영업팀" },
  { nickname: "유태민", local: "taemin.yoo", team: "영업팀" },
  { nickname: "노하은", local: "haeun.noh", team: "영업팀" },
  { nickname: "차승현", local: "seunghyun.cha", team: "영업팀" },
  { nickname: "표지원", local: "jiwon.pyo", team: "영업팀", hiredDaysAgo: 70 },
];

/** 팀마다 할 일 목록 샘플 (반복 규칙). 할 일은 조회할 때 규칙으로 만들어진다 (ADR-004) */
export const DEMO_TASK_LISTS: Record<
  DemoTeamName,
  { name: string; recurrings: { name: string; frequency: "DAILY" | "WEEKLY"; weekDays?: number[] }[] }[]
> = {
  개발팀: [
    {
      name: "스프린트",
      recurrings: [
        { name: "데일리 스탠드업", frequency: "DAILY" },
        { name: "코드 리뷰", frequency: "WEEKLY", weekDays: [2, 4] },
      ],
    },
    {
      name: "운영",
      recurrings: [
        { name: "에러 로그 확인", frequency: "DAILY" },
        { name: "배포 점검", frequency: "WEEKLY", weekDays: [5] },
      ],
    },
  ],
  디자인팀: [
    {
      name: "디자인 QA",
      recurrings: [
        { name: "화면 검수", frequency: "WEEKLY", weekDays: [1, 3] },
        { name: "디자인 시스템 정리", frequency: "WEEKLY", weekDays: [5] },
      ],
    },
  ],
  마케팅팀: [
    {
      name: "캠페인",
      recurrings: [
        { name: "광고 성과 확인", frequency: "DAILY" },
        { name: "주간 리포트", frequency: "WEEKLY", weekDays: [1] },
      ],
    },
  ],
  영업팀: [
    {
      name: "고객 관리",
      recurrings: [
        { name: "리드 정리", frequency: "DAILY" },
        { name: "파이프라인 회의", frequency: "WEEKLY", weekDays: [1] },
      ],
    },
  ],
};
