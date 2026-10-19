import type { Page } from "@playwright/test";
import { expect, openTeamPage, reseedBeforeAll, storageStatePath, test, toast } from "../support";

// 팀의 할 일 목록 (/teams/:id/lists/:id). 할 일을 지우므로 직렬, 시작할 때 시드
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("leader") });
reseedBeforeAll();

const TASK = "데일리 스탠드업"; // 시드: 개발팀 "스프린트" 목록의 매일 반복 할 일

const openTaskList = async (page: Page) => {
  await openTeamPage(page, "개발팀");
  await page.locator("a[href*='/lists/']").first().click();
  await expect(page).toHaveURL(/\/lists\/\d+$/);
};

test("K1 체크 표시를 눌러도 완료되고, 키보드로 상세를 연다 (회귀)", async ({ page }) => {
  await openTaskList(page);
  await expect(page.getByRole("button", { name: `${TASK} 상세보기` })).toBeVisible();
  // 회귀: 체크박스 위의 체크 아이콘이 클릭을 가로채 상자 자체를 누르면 반응하지 않았다
  await page.getByRole("checkbox").first().click();
  await expect(page.getByLabel(`${TASK} 완료`)).toBeVisible();
  await page.getByRole("checkbox").first().click();
  await expect(page.getByLabel(`${TASK} 미완료`)).toBeVisible();

  // 회귀: 카드가 li role="button"이라 그 안의 체크박스·메뉴와 겹쳤다. 이제 상세보기는 따로 있는 버튼이다
  await page.getByRole("button", { name: `${TASK} 상세보기` }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?task=\d+/);
  await expect(page.getByRole("heading", { name: TASK, level: 2 })).toBeVisible();
});
