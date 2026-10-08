import { test as base, expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";

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

export type Role = "hr" | "leader" | "employee";

export const ROLES: Record<Role, { name: string; team: string | null }> = {
  hr: { name: "이서연", team: null },
  leader: { name: "김하늘", team: "개발팀" },
  employee: { name: "박지민", team: "개발팀" },
};

export const storageStatePath = (role: Role) => `e2e/.auth/${role}.json`;

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

function kstToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

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
