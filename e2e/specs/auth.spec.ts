import { ROLES, expect, saveLoginState, storageStatePath, test, toast } from "../support";

// 로드맵 2 §2-1. 라우트 보호는 proxy, 실제 권한은 DB가 확인한다 (화면은 이동만 본다)

test.describe("비로그인", () => {
  for (const path of ["/attendance", "/teams", "/admin/members", "/approvals"]) {
    test(`A1 ${path} → 로그인으로`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("데모 로그인", () => {
  const buttons = { hr: "인사담당자로 보기", leader: "팀장으로 보기", employee: "직원으로 보기" } as const;

  for (const role of Object.keys(buttons) as (keyof typeof buttons)[]) {
    test(`A2 ${buttons[role]} → 내 근태`, async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: new RegExp(buttons[role]) }).click();
      await expect(page).toHaveURL(/\/attendance$/);
      await expect(page.getByRole("heading", { name: "내 근태" })).toBeVisible();
      await expect(page.getByRole("button", { name: "프로필 메뉴" }).first()).toBeVisible();
      await expect(page.getByText(ROLES[role].name).first()).toBeVisible();
    });
  }
});

test.describe("이메일 로그인", () => {
  // 로그인 폼의 이메일 형식 검사는 .test 같은 4글자 도메인을 막으므로 example.com을 쓴다
  const fillLogin = async (page: import("@playwright/test").Page, password: string) => {
    await page.goto("/login");
    await page.getByLabel("이메일").fill("nobody@example.com");
    await page.getByLabel("비밀번호", { exact: true }).fill(password);
  };

  test("A6 틀린 비밀번호 → 안내 토스트", async ({ page }) => {
    await fillLogin(page, "wrong-password-1!");
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(toast(page, "이메일 혹은 비밀번호를 확인해주세요")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("A7 특수문자 없는 비밀번호도 제출할 수 있다 (회귀: 임시 비밀번호로 로그인 불가)", async ({ page }) => {
    await fillLogin(page, "abcd1234");
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
    await expect(page.getByText(/특수문자/)).toHaveCount(0);
  });
});

test("A8 로그아웃하면 로그인 화면, 보호 라우트가 다시 막힌다", async ({ page, playwright, baseURL }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /직원으로 보기/ }).click();
  await expect(page).toHaveURL(/\/attendance$/);

  await page.getByRole("button", { name: "프로필 메뉴" }).first().click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/attendance");
  await expect(page).toHaveURL(/\/login$/);

  // 로그아웃은 직원의 모든 세션을 끊는다. 다른 스펙이 쓰는 저장된 로그인 상태를 새로 만든다
  await saveLoginState(playwright, baseURL!, "employee");
});

test.describe("직원", () => {
  test.use({ storageState: storageStatePath("employee") });

  test("A3 로그인 상태로 /login → 내 근태", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/attendance$/);
  });

  test("A4 관리 화면에 들어갈 수 없고 메뉴도 없다", async ({ page }) => {
    for (const path of ["/admin/members", "/admin/policies", "/approvals"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/attendance$/);
    }
    await page.goto("/teams/new");
    await expect(page).not.toHaveURL(/\/teams\/new$/);

    await page.goto("/attendance");
    await expect(page.getByRole("link", { name: "휴가 승인" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "구성원 관리" })).toHaveCount(0);
  });
});

test.describe("팀장", () => {
  test.use({ storageState: storageStatePath("leader") });

  test("A5 인사담당자 화면은 막히고 휴가 승인은 열린다", async ({ page }) => {
    await page.goto("/admin/policies");
    await expect(page).toHaveURL(/\/attendance$/);
    await page.goto("/approvals");
    await expect(page.getByRole("heading", { name: "휴가 승인" })).toBeVisible();
  });
});
