import { test as base, expect, type Browser, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { SEED_ACCOUNTS, seedEmail } from "./seed/data";
import { E2E_PASSWORD, seedTestData } from "./seed/seed";

export { E2E_PASSWORD };

/** 원격(운영) DB에 대고 돌면 실제 데이터가 망가진다. 로컬 Supabase가 아니면 바로 멈춘다 (ADR-008) */
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
 * 화면을 거치지 않고 계정 상태를 바로 바꿀 때 쓴다 (예: 퇴사 처리된 계정 준비)
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

/**
 * 계정의 오늘 이전 가장 최근 출근 기록에서 퇴근 시각을 지운다 (퇴근을 잊은 날 만들기).
 * 시드는 지난 날에 늘 퇴근 시각을 넣으므로 화면 대신 DB를 바로 고친다. restore로 되돌린다
 */
export const clearLatestClockOut = async (email: string) => {
  const admin = adminSupabase();
  const { data: profile, error } = await admin.from("profiles").select("id").eq("email", email).single();
  if (error) throw new Error(`프로필 조회(${email}): ${error.message}`);

  const { data: record, error: recordError } = await admin
    .from("attendance_records")
    .select("id, date, clock_out_at")
    .eq("user_id", profile.id)
    .lt("date", kstToday())
    .order("date", { ascending: false })
    .limit(1)
    .single();
  if (recordError) throw new Error(`출근 기록 조회(${email}): ${recordError.message}`);

  const setClockOut = async (value: string | null) => {
    const { error: updateError } = await admin
      .from("attendance_records")
      .update({ clock_out_at: value })
      .eq("id", record.id);
    if (updateError) throw new Error(`퇴근 시각 변경(${email}): ${updateError.message}`);
  };
  await setClockOut(null);
  return { date: record.date as string, restore: () => setClockOut(record.clock_out_at) };
};

/**
 * 계정에 오늘(KST) 승인된 휴가를 넣는다. 휴가는 내일부터만 신청할 수 있어 화면으로는 만들 수 없다.
 * remove로 지운다
 */
export const approveLeaveToday = async (email: string) => {
  const admin = adminSupabase();
  const { data: profile, error } = await admin.from("profiles").select("id").eq("email", email).single();
  if (error) throw new Error(`프로필 조회(${email}): ${error.message}`);

  const { data: leave, error: insertError } = await admin
    .from("leave_requests")
    .insert({ user_id: profile.id, date: kstToday(), status: "APPROVED", decided_at: new Date().toISOString() })
    .select("id")
    .single();
  if (insertError) throw new Error(`오늘 휴가 생성(${email}): ${insertError.message}`);

  return {
    remove: async () => {
      const { error: deleteError } = await admin.from("leave_requests").delete().eq("id", leave.id);
      if (deleteError) throw new Error(`오늘 휴가 삭제(${email}): ${deleteError.message}`);
    },
  };
};

/**
 * 계정에 날짜가 지난 대기 중 휴가를 넣는다. 휴가는 내일부터만 신청할 수 있어 화면으로는 만들 수 없다.
 * 어제부터 거슬러 올라가며 신청이 없는 평일을 고른다. remove로 지운다
 */
export const pendingLeaveInPast = async (email: string, reason: string) => {
  const admin = adminSupabase();
  const { data: profile, error } = await admin.from("profiles").select("id").eq("email", email).single();
  if (error) throw new Error(`프로필 조회(${email}): ${error.message}`);

  for (let back = 1; back <= 30; back++) {
    const date = new Date(Date.parse(`${kstToday()}T00:00:00Z`) - back * 86_400_000).toISOString().slice(0, 10);
    if (isWeekendDate(date)) continue;
    const { count } = await admin
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("date", date);
    if (count) continue;

    const { data: leave, error: insertError } = await admin
      .from("leave_requests")
      .insert({ user_id: profile.id, date, reason })
      .select("id")
      .single();
    if (insertError) throw new Error(`지난 휴가 생성(${email}): ${insertError.message}`);
    return {
      date,
      remove: async () => {
        const { error: deleteError } = await admin.from("leave_requests").delete().eq("id", leave.id);
        if (deleteError) throw new Error(`지난 휴가 삭제(${email}): ${deleteError.message}`);
      },
    };
  }
  throw new Error(`지난 30일 안에 휴가를 넣을 평일이 없음(${email})`);
};

/** 테스트에서 만든 계정을 지운다 (Auth 계정을 지우면 프로필·멤버십도 함께 지워진다). 없으면 넘어간다 */
export const deleteAccount = async (email: string) => {
  const admin = adminSupabase();
  const { data: profile } = await admin.from("profiles").select("auth_id").eq("email", email).maybeSingle();
  if (!profile) return;
  const { error } = await admin.auth.admin.deleteUser(profile.auth_id);
  if (error) throw new Error(`계정 삭제(${email}): ${error.message}`);
};

/** 테스트에서 만든 게시글을 지운다 (좋아요·댓글은 cascade). 시드는 게시글을 만들지 않는다 */
export const deleteArticles = async (titlePrefix: string) => {
  const { error } = await adminSupabase().from("articles").delete().like("title", `${titlePrefix}%`);
  if (error) throw new Error(`게시글 삭제(${titlePrefix}): ${error.message}`);
};

/** 로그인 폼으로 로그인을 시도한다 */
export const submitLoginForm = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
};

export type Role = "hr" | "leader" | "employee";

/** 역할별 시드 계정 (e2e/seed/data.ts). 비밀번호는 모두 E2E_PASSWORD */
export const ROLES: Record<Role, { name: string; team: string | null; email: string }> = {
  hr: { name: "이서연", team: null, email: seedEmail(SEED_ACCOUNTS.hr) },
  leader: { name: "김하늘", team: "개발팀", email: seedEmail(SEED_ACCOUNTS.leader) },
  employee: { name: "박지민", team: "개발팀", email: seedEmail(SEED_ACCOUNTS.employee) },
};

export const storageStatePath = (role: Role) => `e2e/.auth/${role}.json`;

/**
 * 로그인 폼으로 로그인해 세션 쿠키를 storageState로 저장한다. 스펙은 이 상태로 시작한다.
 * 로그아웃은 그 사용자의 모든 세션을 끊으므로(supabase signOut 기본 global) 로그아웃한 뒤에도 다시 부른다
 */
export const saveLoginState = async (browser: Browser, baseURL: string, role: Role) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await submitLoginForm(page, ROLES[role].email, E2E_PASSWORD);
  await expect(page).toHaveURL(/\/attendance$/);
  await context.storageState({ path: storageStatePath(role) });
  await context.close();
};

/** 테스트 데이터를 오늘 기준으로 다시 만든다 (e2e/seed). 데이터를 바꾸는 스펙은 시작할 때 부른다 */
export const reseed = () => seedTestData();

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

/** 데이터를 바꾸는 파일의 시작에서 테스트 데이터를 다시 만든다 */
export const reseedBeforeAll = () =>
  test.beforeAll(async () => {
    test.setTimeout(120_000);
    await reseed();
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
  } else if (date.slice(0, 7) < kstToday().slice(0, 7)) {
    await page.getByRole("button", { name: "이전 달" }).click();
  }
  return page.locator(`li[data-date="${date}"]`);
};

/**
 * 휴가 승인 표에서 신청자가 name인 행. 다른 행의 "박지민(대기)과 겹침" 같은 문구에 걸리지 않도록
 * 이름이 정확히 일치하는 요소를 가진 행만 고른다
 */
export const reviewRowOf = (page: Page, name: string) =>
  page
    .getByRole("table")
    .locator("tbody tr")
    .filter({ has: page.getByText(name, { exact: true }) });
