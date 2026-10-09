import type { Page } from "@playwright/test";
import {
  expect,
  hasPastWeekdayThisMonth,
  memberPanel,
  openAs,
  openTeamPage,
  readSummary,
  requestLeave,
  resetDemoBeforeAll,
  reviewRowOf,
  showMonthOf,
  test,
  toast,
} from "../support";

// 로드맵 2 §2-5. 여러 브라우저 컨텍스트로 역할을 오간다
test.describe.configure({ mode: "serial" });
resetDemoBeforeAll();

test("X1 직원 신청 → 팀장 승인 → 직원 달력에 휴가", async ({ browser }) => {
  const employee = await openAs(browser, "employee");
  const { date, label } = await requestLeave(employee, "E2E 승인 흐름");

  const leader = await openAs(browser, "leader");
  await leader.goto("/approvals");
  const row = reviewRowOf(leader, "박지민").filter({ hasText: label });
  await row.getByRole("button", { name: "승인" }).click();
  await expect(toast(leader, "휴가를 승인했어요")).toBeVisible();

  await employee.goto("/attendance");
  await expect(await showMonthOf(employee, date)).toContainText("휴가");
  await expect(
    employee.getByRole("region", { name: "휴가" }).getByRole("listitem").filter({ hasText: label }),
  ).toContainText("승인됨");
});

test("X2 팀장과 인사담당자가 같은 신청을 동시에 처리하면 먼저 처리한 쪽만 적용된다", async ({ browser }) => {
  const employee = await openAs(browser, "employee");
  const { label } = await requestLeave(employee, "E2E 동시 처리");

  const leader = await openAs(browser, "leader");
  const hr = await openAs(browser, "hr");
  await Promise.all([leader.goto("/approvals"), hr.goto("/admin/approvals")]);
  const leaderRow = reviewRowOf(leader, "박지민").filter({ hasText: label });
  const hrRow = reviewRowOf(hr, "박지민").filter({ hasText: label });
  await expect(leaderRow).toBeVisible();
  await expect(hrRow).toBeVisible();

  await Promise.all([
    leaderRow.getByRole("button", { name: "승인" }).click(),
    hrRow.getByRole("button", { name: "반려" }).click(),
  ]);

  /** 그 화면의 결과 토스트가 성공이었는지 (아니면 "이미 처리된 신청입니다") */
  const succeeded = async (page: Page, success: string) => {
    const result = toast(page, new RegExp(`${success}|이미 처리된 신청입니다`)).first();
    await expect(result).toBeVisible();
    return (await result.innerText()).includes(success);
  };
  const [leaderWon, hrWon] = await Promise.all([
    succeeded(leader, "휴가를 승인했어요"),
    succeeded(hr, "휴가를 반려했어요"),
  ]);
  expect([leaderWon, hrWon].filter(Boolean)).toHaveLength(1);

  await employee.goto("/attendance");
  await expect(
    employee.getByRole("region", { name: "휴가" }).getByRole("listitem").filter({ hasText: label }),
  ).toContainText(leaderWon ? "승인됨" : "반려됨");
});

test("X3 인사담당자가 정책을 바꾸면 직원 화면의 판정이 다시 계산된다", async ({ browser }) => {
  test.skip(!hasPastWeekdayThisMonth(), "이번 달에 판정할 지난 평일이 없다 (매월 첫 평일)");
  const employee = await openAs(browser, "employee");
  await employee.goto("/attendance");
  const before = await readSummary(employee);

  // 코어타임 → 자율 출퇴근(기본 정책). 자율은 출근 기록만 있으면 정상이라 지각이 모두 정상이 된다
  const hr = await openAs(browser, "hr");
  await hr.goto("/admin/members");
  await hr.getByLabel("이름·이메일 검색").fill("박지민");
  await hr.getByRole("button", { name: "박지민 메뉴" }).click();
  await hr.getByRole("button", { name: "정보 수정" }).click();
  const dialog = hr.getByRole("dialog");
  await dialog.getByLabel("근태 정책").selectOption({ label: "기본 정책 (자율 출퇴근)" });
  await dialog.getByRole("button", { name: "저장하기" }).click();
  await expect(toast(hr, "정보를 저장했어요")).toBeVisible();

  await employee.reload();
  // E7 회귀: 정책 이름이 유형 이름과 같으면("자율 출퇴근") 한 번만 쓴다
  await expect(employee.getByText(/^근태 정책:/)).toHaveText("근태 정책: 자율 출퇴근 · 출근 기록만 있으면 정상");
  const after = await readSummary(employee);
  expect(after).toEqual({ ...before, 정상: before.정상 + before.지각, 지각: 0 });
});

test("X4 인사담당자가 팀원을 제외하면 팀장 화면에서 빠진다", { tag: "@p2" }, async ({ browser }) => {
  const member = (page: Page) => memberPanel(page).getByRole("listitem").filter({ hasText: "강태오" });
  const hr = await openAs(browser, "hr");
  await openTeamPage(hr, "개발팀");
  await hr.getByRole("button", { name: "강태오 메뉴" }).click();
  await hr.getByRole("button", { name: "팀에서 제외" }).click();
  await hr.getByRole("dialog").getByRole("button", { name: "제외하기" }).click();
  await expect(toast(hr, "팀에서 제외했습니다")).toBeVisible();
  await expect(member(hr)).toHaveCount(0);

  const leader = await openAs(browser, "leader");
  await openTeamPage(leader, "개발팀");
  await expect(memberPanel(leader).getByRole("listitem").first()).toBeVisible();
  await expect(member(leader)).toHaveCount(0);

  // 되돌리기: 구성원 관리에서 개발팀에 다시 배정
  await hr.goto("/admin/members");
  await hr.getByLabel("이름·이메일 검색").fill("강태오");
  await hr.getByRole("button", { name: "강태오 메뉴" }).click();
  await hr.getByRole("button", { name: "정보 수정" }).click();
  const dialog = hr.getByRole("dialog");
  await dialog.getByLabel("배정할 팀").selectOption({ label: "개발팀" });
  await dialog.getByRole("button", { name: "배정", exact: true }).click();
  await expect(dialog.getByRole("combobox", { name: "개발팀 역할" })).toBeVisible();
  await leader.reload();
  await expect(member(leader)).toBeVisible();
});
