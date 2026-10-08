import { expect, openAs, requestLeave, resetDemoBeforeAll, reviewRowOf, showMonthOf, test, toast } from "../support";

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
