import type { Locator, Page } from "@playwright/test";
import { expect, reseedBeforeAll, storageStatePath, test, type Role } from "../support";

// 크로스 브라우징 스크린샷 (docs/cross-browser-analysis.md). playwright.config의 visual-* 4개 프로젝트에서 돈다.
// P2라 nightly·수동 실행에서만 돈다. 기준 이미지는 브라우저별로 CI(리눅스)에서 만든다 ({이름}-{프로젝트}-linux.png)
test.describe.configure({ mode: "serial" });
// 다른 스펙이 바꾼 데이터(출근, 정책, 팀)가 화면에 나오지 않게 처음 상태로 되돌린다
reseedBeforeAll();

/** 데이터가 다 그려질 때까지 (스켈레톤은 aria-busy) */
const waitForContent = async (page: Page, heading?: string) => {
  if (heading) await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
};

/**
 * Pretendard가 실제로 불러와졌는지. font-display: swap이라 늦게 찍으면 fallback이 찍히고,
 * 폰트 파일을 못 불러오면 스크린샷 차이보다 이 메시지가 먼저 원인을 알려 준다
 */
const expectWebFontLoaded = async (page: Page) => {
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
  );
  expect(loaded, "Pretendard 웹폰트가 불러와지지 않았다").toContainEqual(expect.stringMatching(/^pretendard$/i));
};

/**
 * 날짜에 따라 높이가 바뀌는 영역(달력의 주 수, 목록 길이)을 고정한다. 내용은 mask로 가리므로
 * 영역의 크기만 일정하면 된다
 */
const fixHeight = (page: Page, regions: Record<string, number>) =>
  page.addStyleTag({
    content: Object.entries(regions)
      .map(([selector, px]) => `${selector} { height: ${px}px !important; overflow: hidden !important; }`)
      .join("\n"),
  });

/** 화면 전체(뷰포트) 또는 요소 하나를 찍는다. 날짜·시각처럼 날마다 바뀌는 곳은 mask로 가린다 */
const snap = async (target: Page | Locator, name: string, mask: Locator[] = []) => {
  const options = { mask, animations: "disabled", caret: "hide" } as const;
  if ("page" in target) {
    await expectWebFontLoaded(target.page());
    await expect(target).toHaveScreenshot(name, options);
  } else {
    await expectWebFontLoaded(target);
    await expect(target).toHaveScreenshot(name, options);
  }
};

test.describe("공개 화면", { tag: "@p2" }, () => {
  test("로그인", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page, "로그인");
    await snap(page, "login.png");
  });

  test("없는 페이지 (빈 상태)", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByText("요청하신 페이지를 찾을 수 없습니다.")).toBeVisible();
    await snap(page, "not-found.png");
  });
});

const as = (role: Role) => test.use({ storageState: storageStatePath(role) });

test.describe("직원", { tag: "@p2" }, () => {
  as("employee");

  test("내 근태", async ({ page }) => {
    await page.goto("/attendance");
    await waitForContent(page, "내 근태");
    await fixHeight(page, {
      'section[aria-label="월 달력"]': 520,
      'section[aria-labelledby="today-title"]': 220,
      'section[aria-labelledby="leave-title"]': 260,
    });
    await snap(page, "attendance.png", [
      page.locator('span[aria-live="polite"]'), // "2026년 10월"
      page.getByRole("region", { name: "이번 달 요약" }),
      page.getByRole("region", { name: "월 달력" }),
      page.locator('section[aria-labelledby="today-title"]'),
      page.locator('section[aria-labelledby="leave-title"] ul'),
    ]);
  });

  test("자유게시판 (빈 상태)", async ({ page }) => {
    await page.goto("/board");
    await waitForContent(page, "자유게시판");
    await snap(page, "board.png");
  });

  test("모바일 메뉴 서랍", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-mobile-webkit", "모바일 전용 화면");
    await page.goto("/attendance");
    await waitForContent(page, "내 근태");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    await snap(page.getByRole("dialog"), "mobile-drawer.png");
  });
});

test.describe("팀장", { tag: "@p2" }, () => {
  as("leader");

  test("휴가 승인", async ({ page }) => {
    await page.goto("/approvals");
    await waitForContent(page, "휴가 승인");
    const teamCalendar = page.locator('section[aria-labelledby="team-cal-title"]');
    await fixHeight(page, { 'section[aria-labelledby="team-cal-title"] > :last-child': 420 });
    await snap(page, "approvals.png", [
      // 신청 날짜·신청일. 모바일은 카드(ul), 데스크톱은 표(section)라 둘 다 같은 이름이다
      page.getByLabel("승인 대기 목록"),
      teamCalendar.locator("h2 span"), // "2026년 10월 · 평일만"
      teamCalendar.locator(":scope > :last-child"),
    ]);
  });
});

test.describe("인사담당자", { tag: "@p2" }, () => {
  as("hr");

  test("구성원 관리", async ({ page }) => {
    await page.goto("/admin/members");
    await waitForContent(page, "구성원 관리");
    // 이번 달 요약, 오늘 출근 상태 칸
    const volatile = page
      .getByRole("region", { name: "구성원 목록" })
      .locator("tbody td:is(:nth-child(4), :nth-child(5))");
    await snap(page, "admin-members.png", [volatile]);
  });

  test("구성원 정보 수정 (date·select)", async ({ page }) => {
    await page.goto("/admin/members");
    await waitForContent(page, "구성원 관리");
    await page.getByRole("button", { name: "박지민 메뉴" }).click();
    await page.getByRole("button", { name: "정보 수정" }).click();
    const dialog = page.getByRole("dialog");
    // 시드의 입사일은 오늘 기준이라 날마다 바뀐다. 저장하지 않고 화면 값만 고정한다
    await dialog.getByLabel("입사일").fill("2024-03-04");
    await snap(dialog, "edit-employee.png");
  });

  test("근태 정책 (time)", async ({ page }) => {
    await page.goto("/admin/policies");
    await waitForContent(page, "근태 정책");
    await snap(page, "admin-policies.png");
  });
});
