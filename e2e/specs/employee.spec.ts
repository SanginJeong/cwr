import {
  SUMMARY_LABELS,
  expect,
  isWeekendKst,
  kstMonthLabel,
  kstToday,
  readSummary,
  requestLeave,
  reseedBeforeAll,
  showMonthOf,
  storageStatePath,
  test,
  toast,
} from "../support";

// 로드맵 2 §2-2. 출근은 하루 한 번이라 직렬, 시작할 때 시드 (E2E 직원은 오늘 출근 기록이 비어 있다)
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("employee") });
reseedBeforeAll();

test("E1 사이드바 카드로 출근", async ({ page }) => {
  await page.goto("/attendance");
  const card = page.getByRole("region", { name: "오늘 출퇴근" });
  await card.getByRole("button", { name: "출근하기" }).click();

  await expect(toast(page, "출근했어요")).toBeVisible();
  await expect(card.getByRole("button", { name: "퇴근하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "출근하기" })).toHaveCount(0);

  const todayPanel = page.getByRole("region", { name: "오늘", exact: true });
  await expect(todayPanel.getByText("--:--")).toHaveCount(1); // 퇴근만 비어 있다
  // E8 회귀: 1분 미만이면 "0분째 근무 중" 대신 "방금 출근했어요"
  await expect(todayPanel).toContainText("방금 출근했어요");
  if (!isWeekendKst()) {
    await expect(page.locator('li[aria-current="date"]')).toContainText(/정상|지각/);
  }
});

test("E2 퇴근", async ({ page }) => {
  await page.goto("/attendance");
  const card = page.getByRole("region", { name: "오늘 출퇴근" });
  await card.getByRole("button", { name: "퇴근하기" }).click();
  await expect(toast(page, "퇴근했어요")).toBeVisible();
  await expect(card.getByText("오늘 근무를 마쳤어요")).toBeVisible();
});

test("E3 휴가 신청 → 달력 대기 칩과 목록", async ({ page }) => {
  const { date, label } = await requestLeave(page, "E2E 휴가");

  await expect(await showMonthOf(page, date)).toContainText("대기");
  const leaves = page.getByRole("region", { name: "휴가" });
  await expect(leaves.getByRole("listitem").filter({ hasText: label })).toContainText("승인 대기");
});

test("E4 이미 신청한 날짜는 모달에서 고를 수 없다 (점선)", async ({ page }) => {
  const { date } = await requestLeave(page);
  await page.getByRole("button", { name: "휴가 신청", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if (date.slice(0, 7) > kstToday().slice(0, 7)) await dialog.getByRole("button", { name: "다음 달" }).click();
  const day = dialog.locator(`button[data-date="${date}"]`);
  await expect(day).toBeDisabled();
  await expect(day).toHaveClass(/border-dashed/);
});

test("E5 대기 중 신청 취소", async ({ page }) => {
  const { label } = await requestLeave(page);
  const item = page.getByRole("region", { name: "휴가" }).getByRole("listitem").filter({ hasText: label });
  await item.getByRole("button", { name: "신청 취소" }).click();
  await expect(toast(page, "휴가 신청을 취소했어요")).toBeVisible();
  await expect(item).toHaveCount(0);
});

test("E6 이전 달로 가면 요약과 달력이 같은 달을 센다", async ({ page }) => {
  await page.goto("/attendance");
  await page.getByRole("button", { name: "이전 달" }).click();
  await expect(page.getByText(kstMonthLabel(-1), { exact: true })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

  // 시드 데이터는 날마다 달라지므로 숫자 대신 "요약의 상태별 일수 = 그 상태 칩이 있는 칸 수"로 본다
  const summary = await readSummary(page);
  expect(Object.values(summary).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  const days = page.getByRole("region", { name: "월 달력" }).locator("li[data-date]");
  for (const label of SUMMARY_LABELS) {
    await expect(days.filter({ hasText: label }), label).toHaveCount(summary[label]);
  }
});

test("E7 머리말에 정책 이름과 규칙", async ({ page }) => {
  // E2E 직원(개발팀)은 코어타임 정책. 이름이 유형 이름과 같을 때 한 번만 쓰는 회귀는 X3에서 본다
  await page.goto("/attendance");
  const sentence = page.getByText(/^근태 정책:/);
  await expect(sentence).toContainText("코어타임 10–16");
  await expect(sentence).toContainText("10:00까지 출근하면 정상");
});
