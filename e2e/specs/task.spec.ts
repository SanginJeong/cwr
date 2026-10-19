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

test("K2 목록 메뉴의 삭제는 확인을 거친다: 취소하면 남고, 삭제하면 지워진다 (회귀)", async ({ page }) => {
  // 회귀: 메뉴의 "삭제하기"가 확인 없이 바로 지웠다
  await openTaskList(page);
  await page.getByRole("button", { name: `${TASK} 메뉴` }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("할 일 삭제를 진행하시겠어요?");
  await expect(dialog).toContainText(TASK);
  await dialog.getByRole("button", { name: "취소" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: `${TASK} 상세보기` })).toBeVisible();

  await page.getByRole("button", { name: `${TASK} 메뉴` }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  await dialog.getByRole("button", { name: "삭제하기" }).click();
  await expect(toast(page, "할 일 삭제 성공")).toBeVisible();
  await expect(page.getByRole("button", { name: `${TASK} 상세보기` })).toHaveCount(0);
});

test("K3 상세 패널의 삭제도 확인을 거친다 (회귀)", async ({ page }) => {
  // K2에서 오늘 것을 지웠으니 내일 것으로 본다 (매일 반복이라 날마다 하나씩 생긴다)
  await openTaskList(page);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.goto(`${page.url()}?date=${tomorrow.toISOString()}`);
  const item = page.getByRole("button", { name: `${TASK} 상세보기` });
  await item.click();
  await expect(page.getByRole("heading", { name: TASK, level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "할 일 메뉴" }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  // 상세 패널도 dialog라 확인 창은 문구로 고른다
  const dialog = page.getByRole("dialog").filter({ hasText: "할 일 삭제를 진행하시겠어요?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "취소" }).click();
  await expect(page.getByRole("heading", { name: TASK, level: 2 })).toBeVisible();

  await page.getByRole("button", { name: "할 일 메뉴" }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  await dialog.getByRole("button", { name: "삭제하기" }).click();
  await expect(toast(page, "할 일 삭제 성공")).toBeVisible();
  await expect(item).toHaveCount(0);
});

test("K4 상세에서 댓글을 달고 지우면 댓글 수가 바로 바뀐다 (회귀)", async ({ page }) => {
  // 회귀: 댓글 등록이 상세·목록과 다른 키(["task-list", 팀, 목록, 할 일])를 무효화해서 "댓글 0"이 그대로였다
  const TASK2 = "에러 로그 확인"; // 시드: 개발팀 "운영" 목록
  await openTeamPage(page, "개발팀");
  await page.locator("a[href*='/lists/']").nth(1).click();
  await page.getByRole("button", { name: `${TASK2} 상세보기` }).click();
  const panel = page.getByRole("dialog");
  const count = panel.getByRole("heading", { name: "댓글" }).locator("xpath=following-sibling::span");
  await expect(count).toHaveText("0");

  const comment = `E2E 할 일 댓글 ${Date.now()}`;
  await panel.getByPlaceholder("댓글을 달아주세요.").fill(comment);
  await panel.getByRole("button", { name: "댓글 작성" }).click();
  await expect(panel.getByText(comment)).toBeVisible();
  await expect(count).toHaveText("1");
  // 목록 카드의 댓글 수도
  const card = page
    .getByRole("main")
    .locator("li")
    .filter({ has: page.getByRole("button", { name: `${TASK2} 상세보기` }) });
  await expect(card).toContainText("1");

  // 회귀: 댓글 항목이 li가 아니라 목록 항목으로 읽히지 않았고, 메뉴 버튼 이름이 "메뉴 열기"뿐이었다
  await panel.getByRole("listitem").filter({ hasText: comment }).getByRole("button", { name: "댓글 메뉴" }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  await expect(panel.getByText(comment)).toHaveCount(0);
  await expect(count).toHaveText("0");
});
