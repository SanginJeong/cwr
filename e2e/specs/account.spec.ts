import {
  E2E_PASSWORD,
  ROLES,
  expect,
  saveLoginState,
  setAccount,
  storageStatePath,
  submitLoginForm,
  test,
  toast,
} from "../support";

// 계정 설정 (/account). 이름·비밀번호를 바꾸므로 직렬, 끝나면 되돌린다
test.describe.configure({ mode: "serial" });
test.use({ storageState: storageStatePath("employee") });

const nameInput = (page: import("@playwright/test").Page) => page.getByLabel("이름", { exact: true });
const saveChanges = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "변경사항 저장하기" }).click();

test("AC1 이름을 바꾸면 사이드바에도 바로 보인다, 탭 제목", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveTitle("Coworkers | 계정 설정");
  await expect(nameInput(page)).toHaveValue(ROLES.employee.name);

  const renamed = `${ROLES.employee.name}E2E`;
  try {
    await nameInput(page).fill(renamed);
    await saveChanges(page);
    await expect(toast(page, "프로필이 성공적으로 변경되었습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: "프로필 메뉴" }).first()).toContainText(renamed);
  } finally {
    await nameInput(page).fill(ROLES.employee.name);
    await saveChanges(page);
    await expect(page.getByRole("button", { name: "프로필 메뉴" }).first()).toContainText(ROLES.employee.name);
  }
});

test("AC2 다른 사람의 이름으로는 바꿀 수 없고 입력란에 이유가 보인다 (회귀)", async ({ page }) => {
  // 회귀: 토스트로만 "이미 사용중인 닉네임입니다."가 나왔다 (이 서비스에서 이 칸은 "이름"이다)
  await page.goto("/account");
  await nameInput(page).fill(ROLES.leader.name);
  await saveChanges(page);
  await expect(page.getByText("이미 사용 중인 이름이에요.").first()).toBeVisible();
  await expect(nameInput(page)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/닉네임/)).toHaveCount(0);
});

test("AC3 비밀번호를 바꾸면 새 비밀번호로 로그인된다", async ({ page, browser, baseURL }) => {
  const newPassword = "E2Echange!234";
  try {
    await page.goto("/account");
    await page.getByRole("button", { name: "변경하기" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("새 비밀번호", { exact: true }).fill(newPassword);
    await dialog.getByLabel("새 비밀번호 확인", { exact: true }).fill(newPassword);
    await dialog.getByRole("button", { name: "변경하기" }).click();
    await expect(dialog).toHaveCount(0);

    // 이 파일의 storageState(직원 로그인)를 물려받지 않게 빈 상태로 연다
    const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const fresh = await context.newPage();
    await submitLoginForm(fresh, ROLES.employee.email, newPassword);
    await expect(fresh).toHaveURL(/\/attendance$/);
    await context.close();
  } finally {
    await setAccount(ROLES.employee.email, { password: E2E_PASSWORD });
    await saveLoginState(browser, baseURL!, "employee");
  }
});

test.describe("로그인 전", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("AC4 링크 없이 연 비밀번호 재설정 화면은 안내를 보여준다, 탭 제목", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveTitle("Coworkers | 비밀번호 재설정");
    await expect(page.getByText("재설정 링크가 만료되었거나 유효하지 않습니다.", { exact: false })).toBeVisible();
  });
});
