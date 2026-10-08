import {
  expect,
  isWeekendKst,
  requestLeave,
  resetDemoBeforeAll,
  showMonthOf,
  storageStatePath,
  test,
  toast,
} from "../support";

// 로드맵 2 §2-2. 출근은 하루 한 번이라 직렬, 시작할 때 데모 리셋 (데모 직원은 오늘 출근 기록이 비어 있다)
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("employee") });
resetDemoBeforeAll();

test("E1 사이드바 카드로 출근", async ({ page }) => {
  await page.goto("/attendance");
  const card = page.getByRole("region", { name: "오늘 출퇴근" });
  await card.getByRole("button", { name: "출근하기" }).click();

  await expect(toast(page, "출근했어요")).toBeVisible();
  await expect(card.getByRole("button", { name: "퇴근하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "출근하기" })).toHaveCount(0);

  const todayPanel = page.getByRole("region", { name: "오늘", exact: true });
  await expect(todayPanel.getByText("--:--")).toHaveCount(1); // 퇴근만 비어 있다
  if (!isWeekendKst()) {
    await expect(page.locator('li[aria-current="date"]')).toContainText(/정상|지각/);
  }
});

test("E2 퇴근", async ({ page }) => {
  await page.goto("/attendance");
  const card = page.getByRole("region", { name: "오늘 출퇴근" });
  await card.getByRole("button", { name: "퇴근하기" }).click();
  await expect(toast(page, "퇴근했어요")).toBeVisible();
  await expect(card.getByText("오늘 근무를 마쳤어요")).toBeVisible();
});

test("E3 휴가 신청 → 달력 대기 칩과 목록", async ({ page }) => {
  const { date, label } = await requestLeave(page, "E2E 휴가");

  await expect(await showMonthOf(page, date)).toContainText("대기");
  const leaves = page.getByRole("region", { name: "휴가" });
  await expect(leaves.getByRole("listitem").filter({ hasText: label })).toContainText("승인 대기");
});

test("E5 대기 중 신청 취소", async ({ page }) => {
  const { label } = await requestLeave(page);
  const item = page.getByRole("region", { name: "휴가" }).getByRole("listitem").filter({ hasText: label });
  await item.getByRole("button", { name: "신청 취소" }).click();
  await expect(toast(page, "휴가 신청을 취소했어요")).toBeVisible();
  await expect(item).toHaveCount(0);
});
