import {
  countIn,
  expect,
  hasPastWeekdayThisMonth,
  memberPanel,
  openTeamPage,
  reseedBeforeAll,
  reviewRowOf,
  storageStatePath,
  test,
  toast,
} from "../support";
import type { Page } from "@playwright/test";

// 로드맵 2 §2-4
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("hr") });
reseedBeforeAll();

const memberRows = (page: Page) => page.getByRole("region", { name: "구성원 목록" }).locator("tbody tr");
const policyCard = (page: Page, name: string) =>
  page.getByRole("list", { name: "정책 목록" }).getByRole("button").filter({ hasText: name });

/** 구성원 관리에서 그 사람의 "정보 수정" 모달을 연다 */
const openEditModal = async (page: Page, name: string) => {
  await page.goto("/admin/members");
  await page.getByLabel("이름·이메일 검색").fill(name);
  await page.getByRole("button", { name: `${name} 메뉴` }).click();
  await page.getByRole("button", { name: "정보 수정" }).click();
  return page.getByRole("dialog");
};

test("H1 구성원 목록: 재직 수, 시드 계정, 검색과 필터", async ({ page }) => {
  await page.goto("/admin/members");
  const header = page.getByText(/^재직 \d+명/);
  const active = await countIn(header);
  expect(active).toBeGreaterThanOrEqual(30);
  const rows = memberRows(page);
  await expect(rows).toHaveCount(active);
  for (const email of ["hr@coworkers.test", "leader@coworkers.test", "employee@coworkers.test"]) {
    await expect(rows.filter({ hasText: email })).toHaveCount(1);
  }

  const search = page.getByLabel("이름·이메일 검색");
  await search.fill("doyun");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("최도윤");
  await search.fill("최도윤");
  await expect(rows).toContainText("doyun.choi@coworkers.test");
  await search.fill("");

  await page.getByRole("combobox", { name: "팀", exact: true }).selectOption({ label: "디자인팀" });
  await expect(rows).toHaveCount(6);
  await expect(rows.filter({ hasNotText: "디자인팀" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "팀", exact: true }).selectOption("all");

  await page.getByRole("combobox", { name: "근태 정책" }).selectOption({ label: "코어타임 10–16" });
  await expect(rows.first()).toBeVisible();
  await expect(rows.filter({ hasNotText: "코어타임 10–16" })).toHaveCount(0);
});

test("H4 배정된 직원이 있는 정책은 지울 수 없다", async ({ page }) => {
  await page.goto("/admin/policies");
  await policyCard(page, "코어타임 10–16").click();
  const remove = page.getByRole("button", { name: "삭제" });
  await expect(remove).toBeDisabled();
  await expect(remove).toHaveAttribute("title", "배정된 직원이 있으면 지울 수 없어요");
});

test("H7 인사담당자의 휴가 승인은 회사 전체", async ({ page }) => {
  // 시드의 대기: 개발팀 박지민·최도윤·김하늘, 디자인팀 서지호, 마케팅팀 권도현, 영업팀 고은채
  await page.goto("/admin/approvals");
  for (const name of ["박지민", "김하늘", "서지호", "권도현", "고은채"]) {
    await expect(reviewRowOf(page, name).first()).toBeVisible();
  }
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

test("H3 기본 정책을 바꾸면 적용 인원이 다시 계산된다", async ({ page }) => {
  await page.goto("/admin/policies");
  const auto = policyCard(page, "자율 출퇴근");
  const fixed = policyCard(page, "고정 근무 09:00");
  await expect(auto).toContainText("기본");
  const autoBefore = await countIn(auto);
  const fixedBefore = await countIn(fixed);

  const makeDefault = async (card: typeof auto) => {
    await card.click();
    await page.getByRole("button", { name: "기본 정책으로" }).click();
    await expect(toast(page, "기본 정책을 바꿨어요").first()).toBeVisible();
    await expect(card).toContainText("기본");
  };

  // 정책을 따로 정하지 않은 직원(시드: 디자인팀)이 새 기본 정책으로 옮겨 간다
  await makeDefault(fixed);
  await expect.poll(() => countIn(fixed)).toBeGreaterThan(fixedBefore);
  expect((await countIn(fixed)) + (await countIn(auto))).toBe(autoBefore + fixedBefore);

  await makeDefault(auto);
  await expect.poll(() => countIn(auto)).toBe(autoBefore);
  expect(await countIn(fixed)).toBe(fixedBefore);
});

test("H5 팀 역할을 팀장으로 바꾸면 팀 페이지에 팀장 배지", async ({ page }) => {
  const setRole = async (role: "ADMIN" | "MEMBER", text: string) => {
    const dialog = await openEditModal(page, "최도윤");
    await dialog.getByLabel("개발팀 역할").selectOption(role);
    // 팀 배정은 저장 버튼 없이 바로 반영된다. 모달 뒤의 표가 새로 그려질 때까지 기다린다
    await expect(memberRows(page).filter({ hasText: "doyun.choi@coworkers.test" })).toContainText(text);
    await dialog.getByRole("button", { name: "닫기" }).click();
  };
  const member = memberPanel(page).getByRole("listitem").filter({ hasText: "최도윤" });

  await setRole("ADMIN", "개발팀 · 팀장");
  await openTeamPage(page, "개발팀");
  await expect(member).toContainText("팀장");

  await setRole("MEMBER", "개발팀 · 직원");
  await openTeamPage(page, "개발팀");
  await expect(member).toBeVisible();
  await expect(member).not.toContainText("팀장");
});

test("H8 이미지 없이 만든 팀의 수정 페이지가 에러 없이 열리고 이름이 채워져 있다", { tag: "@p2" }, async ({ page }) => {
  // 회귀 2건: 기본 이미지(dicebear) 호스트가 next/image 설정에 없어 수정 페이지가 깨짐, 직접 접근하면 이름 칸이 빔
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const name = `E2E 팀 ${Date.now() % 100000}`;

  await page.goto("/teams/new");
  await page.getByLabel("팀 이름").fill(name);
  await page.getByRole("button", { name: "생성하기" }).click();
  await expect(toast(page, "팀 생성 완료")).toBeVisible();
  await expect(page).toHaveURL(/\/teams\/\d+$/);
  const teamUrl = page.url();

  await page.goto(`${teamUrl}/edit`);
  await expect(page.getByLabel("팀 이름")).toHaveValue(name);
  await expect(page.getByRole("button", { name: "수정하기" })).toBeVisible();
  expect(errors).toEqual([]);

  // 정리: 만든 팀을 지운다
  await page.goto(teamUrl);
  await page.getByRole("button", { name: "팀 설정" }).click();
  await page.getByRole("button", { name: "삭제하기" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "삭제하기" }).click();
  await expect(toast(page, "팀을 성공적으로 삭제")).toBeVisible();
});
