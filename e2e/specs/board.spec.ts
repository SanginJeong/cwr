import type { Page } from "@playwright/test";
import { deleteArticles, expect, storageStatePath, test, toast } from "../support";

// 자유게시판 (/board). 글을 직접 만들고 끝나면 지운다. 같은 글을 이어서 쓰므로 직렬
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("employee") });

const PREFIX = "E2E 게시판";
test.afterAll(() => deleteArticles(PREFIX));

/** 글쓰기 화면으로 글을 올리고 상세로 간다 */
const writeArticle = async (page: Page, title: string, content = "E2E 본문") => {
  await page.goto("/board/new");
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("내용").fill(content);
  await page.getByRole("button", { name: "등록하기" }).click();
  await expect(toast(page, "게시물 등록을 성공했습니다.")).toBeVisible();
  await expect(page).toHaveURL(/\/board\/\d+$/);
};

/** 피드에서 그 글의 항목 (베스트 목록에도 같은 제목이 있어 피드만) */
const feedItem = (page: Page, title: string) =>
  page.getByRole("main").locator("a[href^='/board/']").filter({ hasText: title }).filter({ hasText: "E2E 본문" });

test("B1 글쓰기 → 상세 → 목록에 보인다", async ({ page }) => {
  const title = `${PREFIX} 글 ${Date.now()}`;
  await writeArticle(page, title);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("link", { name: "목록으로" }).click();
  await expect(feedItem(page, title)).toBeVisible();
});

test("B2 수정·좋아요·댓글이 목록에 바로 반영된다 (회귀)", async ({ page }) => {
  // 회귀: 수정·좋아요·댓글이 상세 조회(["article"])만 무효화해서, 목록(["articles"])은
  // staleTime(5분) 동안 예전 제목·좋아요 수를 보였다
  const title = `${PREFIX} 수정 전 ${Date.now()}`;
  const edited = title.replace("수정 전", "수정 후");
  await writeArticle(page, title);
  await page.getByRole("link", { name: "목록으로" }).click();
  const item = feedItem(page, title);
  await expect(item).toBeVisible();
  await expect(item.locator("footer")).toHaveText("0");

  // 목록 → 상세는 클라이언트 이동이라 목록 캐시가 남는다
  await item.click();
  await page.getByRole("button", { name: "좋아요", exact: true }).click();
  await expect(page.getByRole("button", { name: "좋아요 취소" })).toBeVisible();
  await page.getByRole("main").locator('button[aria-haspopup="menu"]').first().click();
  await page.getByRole("button", { name: "수정하기" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("제목").fill(edited);
  await dialog.getByRole("button", { name: "수정하기" }).click();
  await expect(toast(page, "게시물을 성공적으로 수정하였습니다.")).toBeVisible();

  await page.getByRole("link", { name: "목록으로" }).click();
  const editedItem = feedItem(page, edited);
  await expect(editedItem).toBeVisible();
  // 피드 항목 아래쪽(footer)이 좋아요 수
  await expect(editedItem.locator("footer")).toHaveText("1");
});

test("B3 댓글 버튼을 두 번 눌러도 댓글은 하나 (회귀)", async ({ page }) => {
  // 회귀: 등록 중에도 버튼이 켜져 있어(isSubmitting={false}) 같은 댓글이 두 번 올라갔다
  await writeArticle(page, `${PREFIX} 댓글 ${Date.now()}`);
  const comment = `E2E 댓글 ${Date.now()}`;
  await page.getByPlaceholder("댓글을 달아주세요.").fill(comment);
  await page.getByRole("button", { name: "댓글 작성" }).dblclick();
  await expect(toast(page, "댓글을 성공적으로 등록하였습니다.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(comment, { exact: true })).toHaveCount(1);
});
