import { ROLES, expect, storageStatePath, test } from "../support";

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
