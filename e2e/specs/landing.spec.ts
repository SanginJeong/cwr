import { expect, test } from "../support";

// 랜딩 (/). 로그인 전 화면
test.use({ storageState: { cookies: [], origins: [] } });

test("P1 랜딩은 근태·휴가 서비스를 소개하고, 시작하기는 로그인으로 간다", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Coworkers | 출퇴근·휴가 관리");
  const main = page.getByRole("main").first();
  await expect(main.getByText("출퇴근부터 휴가 승인까지")).toBeVisible();
  for (const title of ["출근 버튼 하나로", "휴가 신청부터 승인까지", "오늘 우리 팀의 근태와"]) {
    // 회귀: 첫 섹션이 설명 자리에 제목을 넘겨 같은 문구가 두 번 보였다
    await expect(main.getByText(title)).toHaveCount(1);
  }
  // 피벗 전(할 일 관리 서비스) 문구가 남지 않았다
  await expect(main).not.toContainText("칸반보드");
  await expect(main).not.toContainText("함께 만들어가는 회사");

  await page.getByRole("link", { name: "지금 시작하기" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});
