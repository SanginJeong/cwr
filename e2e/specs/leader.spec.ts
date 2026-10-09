import {
  expect,
  isWeekendDate,
  isWeekendKst,
  memberPanel,
  openAs,
  openTeamPage,
  reseedBeforeAll,
  reviewRowOf,
  storageStatePath,
  test,
  toast,
} from "../support";

// 로드맵 2 §2-3. 시드: 박지민·최도윤이 같은 날 대기, 팀장(김하늘) 본인도 대기 1건
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("leader") });
reseedBeforeAll();

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

// L3(승인)·L4(반려) 전에 본다. 시드의 박지민·최도윤 같은 날 대기가 그대로 있어야 겹침이 보인다
test("L5 팀 휴가 달력: 평일만, 같은 날 겹침", async ({ page }) => {
  await page.goto("/approvals");
  const calendar = page.getByRole("region", { name: /팀 휴가/ });
  const days = calendar.locator("li[data-date]");
  await expect(days.first()).toBeVisible();
  const dates = await days.evaluateAll((els) => els.map((el) => el.getAttribute("data-date")!));
  expect(dates.filter(isWeekendDate)).toEqual([]);

  // 시드: 오늘부터 5평일 뒤 (다음 달일 수 있다)
  const overlapDay = days.filter({ hasText: "최도윤 · 대기" });
  if ((await overlapDay.count()) === 0) await calendar.getByRole("button", { name: "다음 달" }).click();
  await expect(overlapDay).toContainText("겹침 2명");
  await expect(overlapDay).toContainText("박지민 · 대기");
});

test("L3 승인 → 대기 감소, 처리됨 탭", async ({ page }) => {
  await page.goto("/approvals");
  await expect(pendingRows(page).first()).toBeVisible();
  const before = await pendingRows(page).count();

  const pending = reviewRowOf(page, "박지민");
  // 처리됨 탭에는 박지민의 지난 휴가(시드)도 있으므로 방금 승인한 날짜로 찾는다
  const dateLabel = (await pending.locator("td").nth(1).innerText()).trim();
  await pending.getByRole("button", { name: "승인" }).click();
  await expect(toast(page, "휴가를 승인했어요")).toBeVisible();
  await expect(pendingRows(page)).toHaveCount(before - 1);

  await page.getByRole("tab", { name: "처리됨" }).click();
  const done = reviewRowOf(page, "박지민").filter({ hasText: dateLabel });
  await expect(done).toContainText("승인됨");
  await expect(done).toContainText("김하늘");
});

test("L4 반려 → 처리됨 탭에 반려됨", async ({ page }) => {
  await page.goto("/approvals");
  const pending = reviewRowOf(page, "최도윤");
  const dateLabel = (await pending.locator("td").nth(1).innerText()).trim();
  await pending.getByRole("button", { name: "반려" }).click();
  await expect(toast(page, "휴가를 반려했어요")).toBeVisible();
  await expect(pending).toHaveCount(0);

  await page.getByRole("tab", { name: "처리됨" }).click();
  const done = reviewRowOf(page, "최도윤").filter({ hasText: dateLabel });
  await expect(done).toContainText("반려됨");
  await expect(done).toContainText("김하늘");
});

test("L6 팀 페이지의 오늘 우리 팀 근태는 팀장에게만", async ({ page, browser }) => {
  await openTeamPage(page, "개발팀");
  const panel = memberPanel(page);
  await expect(panel.getByRole("region", { name: "오늘 우리 팀 근태" })).toBeVisible();
  if (!isWeekendKst()) {
    // 평일에는 멤버마다 오늘 근태 칩 (출근 전이면 "미출근")
    await expect(
      panel
        .getByRole("listitem")
        .filter({ hasText: /정상|지각|휴가|미출근/ })
        .first(),
    ).toBeVisible();
  }

  const employee = await openAs(browser, "employee");
  await employee.goto(page.url());
  await expect(memberPanel(employee).getByRole("listitem").first()).toBeVisible();
  await expect(employee.getByRole("region", { name: "오늘 우리 팀 근태" })).toHaveCount(0);
});

test("L7 팀장에게는 팀 수정·삭제, 팀에서 제외, 팀 추가하기가 없다", async ({ page }) => {
  await openTeamPage(page, "개발팀");
  await expect(memberPanel(page).getByRole("listitem").first()).toBeVisible();
  await expect(page.getByText("진행 상황")).toBeVisible();

  await expect(page.getByRole("button", { name: "팀 설정" })).toHaveCount(0);
  await expect(memberPanel(page).getByRole("button", { name: /메뉴$/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "팀 추가하기" })).toHaveCount(0);
});
