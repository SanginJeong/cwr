import {
  test as base,
  expect,
  type APIRequestContext,
  type Browser,
  type Locator,
  type Page,
  type PlaywrightWorkerArgs,
} from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/** 원격(운영·데모) DB에 대고 돌면 데모 데이터가 망가진다. 로컬 Supabase가 아니면 바로 멈춘다 (ADR-008) */
export const assertLocalSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    throw new Error(
      `E2E는 Supabase 로컬 스택에서만 돈다. 지금 NEXT_PUBLIC_SUPABASE_URL=${url || "(없음)"}\n` +
        "npx supabase start → npm run e2e:env 로 .env.e2e를 만드세요.",
    );
  }
};

/**
 * service role 클라이언트. 로컬 스택에서만 만든다.
 * 화면에서는 막혀 있는 준비(데모 인사담당자는 퇴사 처리를 못 한다, H6)를 테스트에서 직접 할 때 쓴다
 */
const adminSupabase = () => {
  assertLocalSupabase();
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/**
 * 계정의 비밀번호와 재직 상태를 바꾼다. 퇴사 처리 BFF(/api/admin/employees/{id})와 같은 방식:
 * profiles.is_active + Auth 로그인 차단(ban)
 */
export const setAccount = async (email: string, { password, active }: { password?: string; active?: boolean }) => {
  const admin = adminSupabase();
  const { data: profile, error } = await admin.from("profiles").select("id, auth_id").eq("email", email).single();
  if (error) throw new Error(`프로필 조회(${email}): ${error.message}`);

  const attributes = {
    ...(password && { password }),
    ...(active !== undefined && { ban_duration: active ? "none" : "876000h" }),
  };
  const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_id, attributes);
  if (authError) throw new Error(`Auth 변경(${email}): ${authError.message}`);
  if (active !== undefined) {
    const { error: activeError } = await admin.from("profiles").update({ is_active: active }).eq("id", profile.id);
    if (activeError) throw new Error(`재직 상태 변경(${email}): ${activeError.message}`);
  }
};

/** 로그인 폼으로 로그인을 시도한다 */
export const submitLoginForm = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
};

export type Role = "hr" | "leader" | "employee";

export const ROLES: Record<Role, { name: string; team: string | null }> = {
  hr: { name: "이서연", team: null },
  leader: { name: "김하늘", team: "개발팀" },
  employee: { name: "박지민", team: "개발팀" },
};

export const storageStatePath = (role: Role) => `e2e/.auth/${role}.json`;

/**
 * 데모 로그인해 세션 쿠키를 storageState로 저장한다. 스펙은 이 상태로 시작한다.
 * 로그아웃은 그 사용자의 모든 세션을 끊으므로(supabase signOut 기본 global) 로그아웃한 뒤에도 다시 부른다
 */
export const saveLoginState = async (playwright: PlaywrightWorkerArgs["playwright"], baseURL: string, role: Role) => {
  const context = await playwright.request.newContext({ baseURL });
  const res = await context.post("/api/demo-login", { data: { role } });
  if (!res.ok()) throw new Error(`데모 로그인 실패(${role}): ${res.status()} ${await res.text()}`);
  await context.storageState({ path: storageStatePath(role) });
  await context.dispose();
};

/** 데모 데이터를 오늘 기준으로 되돌린다. 데이터를 바꾸는 스펙은 시작할 때 부른다 */
export const resetDemo = async (request: APIRequestContext) => {
  const res = await request.get("/api/cron/reset-demo", {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    timeout: 120_000,
  });
  expect(res.status(), await res.text()).toBe(200);
  return res.json();
};

/** 오늘(KST)이 주말인지. 주말에는 판정하지 않아 결과가 달라지는 단언을 건너뛴다 */
export const isWeekendKst = () => {
  const day = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCDay();
  return day === 0 || day === 6;
};

/** 다른 역할로 로그인된 새 브라우저 컨텍스트 (역할을 넘나드는 흐름, 동시 승인 경쟁) */
export const openAs = async (browser: Browser, role: Role): Promise<Page> => {
  const context = await browser.newContext({ storageState: storageStatePath(role) });
  return context.newPage();
};

/** 토스트 (react-hot-toast는 role="status") */
export const toast = (page: Page, text: string | RegExp) => page.getByRole("status").filter({ hasText: text });

export const test = base;
export { expect };

/** 데이터를 바꾸는 describe의 시작에서 데모 데이터를 되돌린다 */
export const resetDemoBeforeAll = () =>
  test.beforeAll(async ({ playwright }, testInfo) => {
    const request = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    await resetDemo(request);
    await request.dispose();
  });

/** 이번 달(KST)에 오늘 이전 평일이 있는지 */
export const hasPastWeekdayThisMonth = () => {
  const today = kstToday();
  for (let day = 1; day < Number(today.slice(8, 10)); day++) {
    const weekday = new Date(`${today.slice(0, 8)}${String(day).padStart(2, "0")}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) return true;
  }
  return false;
};

export function kstToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD"가 토·일인지 */
export const isWeekendDate = (date: string) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

/** 이번 달(KST)에서 offset만큼 옮긴 달의 화면 이름 ("2026년 9월") */
export const kstMonthLabel = (offset = 0) => {
  const d = new Date(`${kstToday().slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월`;
};

export const SUMMARY_LABELS = ["정상", "지각", "결근", "휴가"] as const;
export type SummaryLabel = (typeof SUMMARY_LABELS)[number];

/** 내 근태의 "이번 달 요약" 카드 숫자 */
export const readSummary = async (page: Page) => {
  const region = page.getByRole("region", { name: "이번 달 요약" });
  await expect(region).toBeVisible();
  const result = {} as Record<SummaryLabel, number>;
  for (const label of SUMMARY_LABELS) {
    const text = await region.locator(":scope > div").filter({ hasText: label }).innerText();
    result[label] = Number(text.match(/(\d+)\s*일/)![1]);
  }
  return result;
};

/** 사이드바의 "팀 선택"에서 팀 페이지로 간다 */
export const openTeamPage = async (page: Page, team: string) => {
  await page.goto("/attendance");
  await page.getByRole("button", { name: "팀 선택" }).click();
  await page.getByRole("link", { name: team, exact: true }).click();
  await expect(page).toHaveURL(/\/teams\/\d+$/);
};

/** 팀 페이지 오른쪽의 팀 멤버 영역 */
export const memberPanel = (page: Page) => page.getByRole("complementary", { name: "팀 멤버" });

/** "N명" 같은 문구에서 숫자만 */
export const countIn = async (locator: Locator, unit = "명") =>
  Number((await locator.innerText()).match(new RegExp(`(\\d+)${unit}`))![1]);

/**
 * 내 근태에서 휴가를 신청한다. 고를 수 있는 첫 날짜(내일 이후 평일, 아직 신청하지 않은 날)를 고른다.
 * @returns 날짜("YYYY-MM-DD")와 화면에 쓰이는 이름("10월 15일 (목)")
 */
export const requestLeave = async (page: Page, reason?: string) => {
  await page.goto("/attendance");
  await page.getByRole("button", { name: "휴가 신청", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const firstOpenDay = () => dialog.locator("button[data-date]:not([disabled])").first();

  await expect(dialog.locator("button[data-date]").first()).toBeVisible();
  if ((await firstOpenDay().count()) === 0) await dialog.getByRole("button", { name: "다음 달" }).click();

  const day = firstOpenDay();
  const date = (await day.getAttribute("data-date"))!;
  const label = (await day.getAttribute("aria-label"))!;
  await day.click();
  if (reason) await dialog.getByLabel("사유 (선택)").fill(reason);
  await dialog.getByRole("button", { name: "신청하기" }).click();
  await expect(toast(page, "휴가를 신청했어요")).toBeVisible();
  return { date, label };
};

/** 내 근태 달력을 date가 있는 달로 옮긴다 (신청한 휴가가 다음 달일 수 있다) */
export const showMonthOf = async (page: Page, date: string) => {
  if (date.slice(0, 7) > kstToday().slice(0, 7)) {
    await page.getByRole("button", { name: "다음 달" }).click();
  }
  return page.locator(`li[data-date="${date}"]`);
};

/**
 * 휴가 승인 표에서 신청자가 name인 행. 다른 행의 "박지민(대기)와 겹침" 같은 문구에 걸리지 않도록
 * 이름이 정확히 일치하는 요소를 가진 행만 고른다
 */
export const reviewRowOf = (page: Page, name: string) =>
  page
    .getByRole("table")
    .locator("tbody tr")
    .filter({ has: page.getByText(name, { exact: true }) });
