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
  // 화요일·목요일에는 주간 반복 "코드 리뷰"도 같은 날 보여 첫 체크박스가 그 할 일일 수 있다. 이 할 일의 카드 안에서 고른다
  const checkbox = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: `${TASK} 상세보기` }) })
    .getByRole("checkbox");
  // 회귀: 체크박스 위의 체크 아이콘이 클릭을 가로채 상자 자체를 누르면 반응하지 않았다
  await checkbox.click();
  await expect(page.getByLabel(`${TASK} 완료`)).toBeVisible();
  await checkbox.click();
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

test("K5 할 일 만들기: 제목만으로 만들 수 있고, 저장되지 않는 시간 칸은 없다", async ({ page }) => {
  // 회귀: 메모가 비어 있으면 안내 없이 "만들기"가 꺼져 있었다. 시간 칸은 고를 수 있었지만 저장되지 않았다(DB에 칸이 없다)
  await openTaskList(page);
  await page.getByRole("button", { name: "할 일 만들기" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("시작 날짜")).toBeVisible();
  await expect(dialog.getByText(/오전|오후/)).toHaveCount(0);

  const name = `E2E 할 일 ${Date.now()}`;
  await dialog.getByLabel("할 일 제목").fill(name);
  await dialog.getByRole("button", { name: "만들기" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: `${name} 상세보기` })).toBeVisible();
});

test("K6 Esc는 맨 위 창만 닫고, 링크로 바로 연 상세도 닫기를 누르면 목록에 남는다 (회귀)", async ({ page }) => {
  const TASK2 = "에러 로그 확인";
  await openTeamPage(page, "개발팀");
  await page.locator("a[href*='/lists/']").nth(1).click();
  await page.getByRole("button", { name: `${TASK2} 상세보기` }).click();
  const heading = page.getByRole("heading", { name: TASK2, level: 2 });
  await expect(heading).toBeVisible();

  // 수정 창의 Esc는 수정 창만 닫는다
  await page.getByRole("button", { name: "할 일 메뉴" }).click();
  await page.getByRole("button", { name: "수정하기" }).click();
  const edit = page.getByRole("dialog").filter({ hasText: "할 일 수정" });
  await expect(edit).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(edit).toHaveCount(0);
  await expect(heading).toBeVisible();

  // 회귀: 상세 패널은 모달인데 Esc로 닫히지 않았다
  await page.keyboard.press("Escape");
  await expect(heading).toHaveCount(0);
  await expect(page).not.toHaveURL(/task=/);

  // 회귀: 닫기가 router.back()이라, 링크로 바로 열면 앱 밖(이전 페이지)으로 나갔다
  const listUrl = page.url();
  await page.goto("about:blank");
  await page.goto(`${listUrl}${listUrl.includes("?") ? "&" : "?"}task=${await taskIdOf(page, listUrl, TASK2)}`);
  await expect(heading).toBeVisible();
  await page.getByRole("button", { name: "닫기" }).click();
  await expect(heading).toHaveCount(0);
  await expect(page).toHaveURL(/\/lists\/\d+/);
  await expect(page).not.toHaveURL(/task=/);
});

/** 목록에서 그 할 일을 눌러 주소의 task id를 얻는다 */
const taskIdOf = async (page: Page, listUrl: string, name: string) => {
  await page.goto(listUrl);
  await page.getByRole("button", { name: `${name} 상세보기` }).click();
  await expect(page).toHaveURL(/task=\d+/);
  const id = new URL(page.url()).searchParams.get("task")!;
  await page.goto("about:blank");
  return id;
};
