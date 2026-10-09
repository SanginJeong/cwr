import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, storageStatePath, test, type Role } from "../support";

// 로드맵 2 §2-8. P2라 nightly에서만 돈다 (PR CI는 @p2를 뺀다)

/** 데이터가 다 그려질 때까지 (스켈레톤은 aria-busy) */
const waitForContent = async (page: Page, heading: string) => {
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
};

/** WCAG 2.1 A·AA 위반 중 serious·critical. 실패 메시지에 규칙과 요소가 보이도록 문자열로 */
const seriousViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // 색 대비는 검사하지 않는다. 브랜드 팔레트를 그대로 두기로 했다 (2026-10-09, 위반 목록은 docs/roadmap-e2e.md §4)
    .disableRules(["color-contrast"])
    .analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};

test.describe("V1 접근성 (axe)", { tag: "@p2" }, () => {
  test("로그인", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page, "로그인");
    expect(await seriousViolations(page)).toEqual([]);
  });

  const pages: { role: Role; path: string; heading: string }[] = [
    { role: "employee", path: "/attendance", heading: "내 근태" },
    { role: "leader", path: "/approvals", heading: "휴가 승인" },
    { role: "hr", path: "/admin/members", heading: "구성원 관리" },
    { role: "hr", path: "/admin/policies", heading: "근태 정책" },
  ];
  for (const { role, path, heading } of pages) {
    test.describe(() => {
      test.use({ storageState: storageStatePath(role) });
      test(heading, async ({ page }) => {
        await page.goto(path);
        await waitForContent(page, heading);
        expect(await seriousViolations(page)).toEqual([]);
      });
    });
  }
});

// 데이터가 날마다 바뀌는 화면은 빼고, 고정된 화면만 비교한다. 기준 이미지는 CI(리눅스)에서 만든다
test.describe("V2 스크린샷", { tag: "@p2" }, () => {
  test("로그인", async ({ page }) => {
    await page.goto("/login");
    await waitForContent(page, "로그인");
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("없는 페이지 (빈 상태)", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByText("요청하신 페이지를 찾을 수 없습니다.")).toBeVisible();
    await expect(page).toHaveScreenshot("not-found.png", { fullPage: true });
  });
});
