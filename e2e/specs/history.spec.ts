import type { Page } from "@playwright/test";
import { expect, openTeamPage, reseedBeforeAll, storageStatePath, test, toast } from "../support";

// 마이 히스토리 (/history): 내가 완료한 할 일. 할 일을 바꾸므로 직렬, 시작할 때 시드
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("employee") });
reseedBeforeAll();

const TASK = "데일리 스탠드업"; // 시드: 개발팀 "스프린트" 목록의 매일 반복 할 일

/** 개발팀 첫 할 일 목록을 연다 (오늘 날짜가 선택돼 있다) */
const openTaskList = async (page: Page) => {
  await openTeamPage(page, "개발팀");
  await page.locator("a[href*='/lists/']").first().click();
  await expect(page).toHaveURL(/\/lists\/\d+$/);
};

/** 프로필 메뉴로 히스토리에 간다. 클라이언트 이동이라 캐시된 조회를 그대로 쓴다 */
const openHistoryFromMenu = async (page: Page) => {
  await page.getByRole("button", { name: "프로필 메뉴" }).first().click();
  await page.getByRole("button", { name: "마이 히스토리" }).click();
  await expect(page).toHaveURL(/\/history$/);
  return page.getByRole("main");
};

test("T1 완료한 할 일이 히스토리에 보이고, 완료를 취소하면 빠진다", async ({ page }) => {
  await page.goto("/history");
  await expect(page).toHaveTitle("Coworkers | 마이 히스토리");
  await expect(page.getByText("텅— 비어 있어요.")).toBeVisible();

  await openTaskList(page);
  await page.getByLabel(`${TASK} 미완료`).click();
  await expect(page.getByLabel(`${TASK} 완료`)).toBeVisible();

  const main = await openHistoryFromMenu(page);
  await expect(main.getByLabel(`${TASK} 완료`)).toBeVisible();

  await page.goBack();
  await page.getByLabel(`${TASK} 완료`).click();
  await expect(page.getByLabel(`${TASK} 미완료`)).toBeVisible();
  await openHistoryFromMenu(page);
  await expect(page.getByText("텅— 비어 있어요.")).toBeVisible();
});

test("T2 완료한 할 일을 지우면 히스토리에서도 빠진다 (회귀)", async ({ page }) => {
  // 회귀: 삭제가 히스토리 캐시를 무효화하지 않아, 지운 할 일이 staleTime(10분) 동안 히스토리에 남았다
  await openTaskList(page);
  await page.getByLabel(`${TASK} 미완료`).click();
  await expect(page.getByLabel(`${TASK} 완료`)).toBeVisible();
  const main = await openHistoryFromMenu(page);
  await expect(main.getByLabel(`${TASK} 완료`)).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: `${TASK} 메뉴` }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  await expect(toast(page, "할 일 삭제 성공")).toBeVisible();

  await openHistoryFromMenu(page);
  await expect(page.getByText("텅— 비어 있어요.")).toBeVisible();
  await expect(page.getByRole("main").getByText(TASK)).toHaveCount(0);
});
