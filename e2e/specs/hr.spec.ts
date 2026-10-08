import { expect, hasPastWeekdayThisMonth, resetDemoBeforeAll, storageStatePath, test, toast } from "../support";

// 로드맵 2 §2-4
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("hr") });
resetDemoBeforeAll();

test("H6 데모 계정은 직원을 추가할 수 없다", async ({ page }) => {
  await page.goto("/admin/members");
  await page.getByRole("button", { name: "직원 추가" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("이름").fill("E2E 지원자");
  await dialog.getByLabel("이메일 (로그인 아이디)").fill("e2e-new@coworkers.test");
  await dialog.getByRole("button", { name: "추가하기" }).click();
  await expect(toast(page, /데모 계정에서는/)).toBeVisible();
});

test("H2 정책을 바꾸면 같은 기록이 다시 판정된다", async ({ page }) => {
  // 05:00 고정·유예 0분이면 이번 달 출근은 모두 지각이다 (판정을 저장하지 않으므로 지난 기록도)
  const policyName = `E2E 05시 고정 ${Date.now()}`;
  await page.goto("/admin/policies");
  await page.getByRole("button", { name: "새 정책" }).click();
  await page.getByLabel("이름", { exact: true }).fill(policyName);
  // "고정" 유형 카드 설명("출근 시각 + 유예")에도 같은 글자가 있어서 정확히 일치하는 라벨만
  await page.getByLabel("출근 시각", { exact: true }).fill("05:00");
  await page.getByLabel("유예 (분)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(toast(page, "정책을 저장했어요")).toBeVisible();

  await page.goto("/admin/members");
  await page.getByLabel("이름·이메일 검색").fill("박지민");
  const row = page.getByRole("row").filter({ hasText: "employee@coworkers.test" });
  await expect(row).toBeVisible();

  await page.getByRole("button", { name: "박지민 메뉴" }).click();
  await page.getByRole("button", { name: "정보 수정" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("근태 정책").selectOption({ label: policyName });
  await dialog.getByRole("button", { name: "저장하기" }).click();
  await expect(toast(page, "정보를 저장했어요")).toBeVisible();

  await expect(row).toContainText(policyName);
  await expect(row).not.toContainText("정상");
  // 이번 달에 지난 평일이 있어야 판정할 기록이 있다 (매월 첫 평일에는 "기록 없음")
  if (hasPastWeekdayThisMonth()) await expect(row).toContainText("지각");
});
