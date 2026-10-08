import { expect, resetDemoBeforeAll, reviewRowOf, storageStatePath, test, toast } from "../support";

// 로드맵 2 §2-3. 시드: 박지민·최도윤이 같은 날 대기, 팀장(김하늘) 본인도 대기 1건
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("leader") });
resetDemoBeforeAll();

const pendingRows = (page: import("@playwright/test").Page) => page.getByRole("table").locator("tbody tr");

test("L1 사이드바 배지 = 대기 목록 수", async ({ page }) => {
  await page.goto("/approvals");
  await expect(pendingRows(page).first()).toBeVisible();
  const count = await pendingRows(page).count();
  await expect(page.getByRole("link", { name: "휴가 승인" })).toContainText(String(count));
});

test("L2 같은 날 겹침 표시, 팀장 본인 신청은 목록에 없음", async ({ page }) => {
  await page.goto("/approvals");
  await expect(reviewRowOf(page, "박지민")).toContainText("최도윤");
  await expect(reviewRowOf(page, "최도윤")).toContainText("박지민");
  await expect(pendingRows(page).filter({ hasText: "겹침" })).not.toHaveCount(0);
  await expect(reviewRowOf(page, "김하늘")).toHaveCount(0);
});

test("L3 승인 → 대기 감소, 처리됨 탭", async ({ page }) => {
  await page.goto("/approvals");
  await expect(pendingRows(page).first()).toBeVisible();
  const before = await pendingRows(page).count();

  await reviewRowOf(page, "박지민").getByRole("button", { name: "승인" }).click();
  await expect(toast(page, "휴가를 승인했어요")).toBeVisible();
  await expect(pendingRows(page)).toHaveCount(before - 1);

  await page.getByRole("tab", { name: "처리됨" }).click();
  const done = reviewRowOf(page, "박지민");
  await expect(done).toContainText("승인됨");
  await expect(done).toContainText("김하늘");
});
