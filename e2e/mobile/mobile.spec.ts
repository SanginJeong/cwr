import type { Page } from "@playwright/test";
import { expect, openAs, requestLeave, resetDemoBeforeAll, storageStatePath, test, toast } from "../support";

// 로드맵 2 §2-6. 390×844 (playwright.config의 mobile 프로젝트). 출근은 하루 한 번이라 직렬, 시작할 때 데모 리셋
test.describe.configure({ mode: "serial" });
resetDemoBeforeAll();

/** 가로 스크롤이 생기지 않는다 (모바일에서 표·달력이 화면 밖으로 밀리던 문제) */
const expectNoHorizontalScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
};

test.describe("직원", () => {
  test.use({ storageState: storageStatePath("employee") });

  test("M1 첫 화면은 서랍이 닫혀 있고 헤더에 출퇴근 상태 (회귀: 서랍이 열린 채 시작)", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByRole("link", { name: /^내 근태: 출근 전/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("M2 서랍 안 카드로 출근, 다른 페이지로 가면 서랍이 닫힌다", async ({ page }) => {
    await page.goto("/attendance");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("region", { name: "오늘 출퇴근" }).getByRole("button", { name: "출근하기" }).click();
    await expect(toast(page, "출근했어요")).toBeVisible();
    await expect(page.getByRole("link", { name: /^내 근태: 근무 중/ })).toBeVisible();

    await drawer.getByRole("link", { name: "자유게시판" }).click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("M4 내 근태 달력은 색 막대로, 가로 스크롤 없음", { tag: "@p2" }, async ({ page }) => {
    await page.goto("/attendance");
    const days = page.getByRole("region", { name: "월 달력" }).locator("li[data-date]");
    await expect(days.first()).toBeVisible();
    await expectNoHorizontalScroll(page);

    // 판정이 있는 칸: 글자 칩은 숨고 색 막대만 보인다 (매월 첫 평일 등 판정할 날이 없으면 건너뛴다)
    const judged = days.filter({ has: page.locator('span[class*="tablet:inline-block"]') }).first();
    if ((await judged.count()) === 0) return;
    await expect(judged.locator('span[class*="tablet:inline-block"]')).toBeHidden();
    await expect(judged.locator('span[class*="tablet:hidden"]').first()).toBeVisible();
  });

  test(
    "M5 낮은 화면에서도 휴가 신청 버튼까지 스크롤로 닿는다 (회귀: 모달이 잘림)",
    { tag: "@p2" },
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 600 });
      await page.goto("/attendance");
      await page.getByRole("button", { name: "휴가 신청", exact: true }).click();
      const submit = page.getByRole("dialog").getByRole("button", { name: "신청하기" });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport({ ratio: 1 });
    },
  );
});

test.describe("팀장", () => {
  test.use({ storageState: storageStatePath("leader") });

  test("M3 휴가 승인은 카드형, 승인·반려 버튼이 화면 안에 (회귀: 버튼이 화면 밖)", async ({ page, browser }) => {
    // 승인할 신청이 있어야 한다. 시드에도 있지만 직원으로 하나 더 만든다
    const employee = await openAs(browser, "employee");
    await requestLeave(employee, "E2E 모바일 승인");

    await page.goto("/approvals");
    const card = page
      .getByRole("list", { name: "승인 대기 목록" })
      .getByRole("listitem")
      .filter({ hasText: "E2E 모바일 승인" });
    await card.scrollIntoViewIfNeeded();
    for (const name of ["반려", "승인"]) {
      await expect(card.getByRole("button", { name })).toBeInViewport({ ratio: 1 });
    }
    await expectNoHorizontalScroll(page);
    // 표는 모바일에서 숨는다
    await expect(page.getByRole("table")).toBeHidden();

    await card.getByRole("button", { name: "승인" }).click();
    await expect(toast(page, "휴가를 승인했어요")).toBeVisible();
  });
});
