import {
  E2E_PASSWORD,
  ROLES,
  expect,
  openAs,
  saveLoginState,
  setAccount,
  storageStatePath,
  submitLoginForm,
  test,
  toast,
  type Role,
} from "../support";

// 로드맵 2 §2-1. 라우트 보호는 proxy, 실제 권한은 DB가 확인한다 (화면은 이동만 본다)

test.describe("비로그인", () => {
  for (const path of ["/attendance", "/teams", "/admin/members", "/approvals"]) {
    test(`A1 ${path} → 로그인으로`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("이메일 로그인 3역할", () => {
  const labels: Record<Role, string> = { hr: "인사담당자", leader: "팀장", employee: "직원" };

  for (const role of Object.keys(labels) as Role[]) {
    test(`A2 ${labels[role]} 로그인 → 내 근태`, async ({ page }) => {
      await submitLoginForm(page, ROLES[role].email, E2E_PASSWORD);
      await expect(page).toHaveURL(/\/attendance$/);
      await expect(page.getByRole("heading", { name: "내 근태" })).toBeVisible();
      await expect(page.getByRole("button", { name: "프로필 메뉴" }).first()).toBeVisible();
      await expect(page.getByText(ROLES[role].name).first()).toBeVisible();
    });
  }

  test("A2 로그인 화면에 계정 없이 둘러보기가 없다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeVisible();
    await expect(page.getByText(/둘러보기|으로 보기/)).toHaveCount(0);
  });
});

test.describe("이메일 로그인", () => {
  test("A6 틀린 비밀번호 → 안내 토스트", async ({ page }) => {
    await submitLoginForm(page, "nobody@example.com", "wrong-password-1!");
    await expect(toast(page, "이메일 혹은 비밀번호를 확인해주세요")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("A7 특수문자 없는 비밀번호, .test 같은 긴 최상위 도메인도 제출할 수 있다 (회귀 2건)", async ({ page }) => {
    // 회귀: 임시 비밀번호(특수문자 없음)로 로그인 불가, 최상위 도메인 2~3글자 제한으로 @coworkers.test 로그인 불가
    await page.goto("/login");
    await page.getByLabel("이메일").fill("employee@coworkers.test");
    await page.getByLabel("비밀번호", { exact: true }).fill("abcd1234");
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
    await expect(page.getByText(/특수문자|이메일 형식/)).toHaveCount(0);
  });

  test("A9 퇴사 처리된 계정은 로그인할 수 없고, 복직하면 다시 된다", { tag: "@p2" }, async ({ browser, page }) => {
    const email = "doyun.choi@coworkers.test";
    const hr = await openAs(browser, "hr");
    // 인사담당자 화면(구성원 관리)에서 퇴사 처리·복직: BFF가 DB 비활성화 + Auth 로그인 차단
    const setActive = async (active: boolean) => {
      await hr.goto("/admin/members");
      await hr.getByRole("combobox", { name: "재직 상태" }).selectOption("all");
      await hr.getByLabel("이름·이메일 검색").fill("최도윤");
      await hr.getByRole("button", { name: "최도윤 메뉴" }).click();
      if (active) {
        await hr.getByRole("button", { name: "복직" }).click();
        await expect(toast(hr, "복직 처리했어요")).toBeVisible();
      } else {
        await hr.getByRole("button", { name: "퇴사 처리" }).click();
        await hr.getByRole("dialog").getByRole("button", { name: "퇴사 처리" }).click();
        await expect(toast(hr, "퇴사 처리했어요")).toBeVisible();
      }
    };

    try {
      await setActive(false);
      await submitLoginForm(page, email, E2E_PASSWORD);
      await expect(toast(page, "퇴사 처리된 계정입니다")).toBeVisible();

      await setActive(true);
      await submitLoginForm(page, email, E2E_PASSWORD);
      await expect(page).toHaveURL(/\/attendance$/);
      await expect(page.getByText("최도윤").first()).toBeVisible();
    } finally {
      // 중간에 실패해도 다음 스펙이 쓸 수 있게 되돌린다
      await setAccount(email, { active: true });
    }
  });
});

test("A8 로그아웃하면 로그인 화면, 보호 라우트가 다시 막힌다", async ({ page, browser, baseURL }) => {
  await submitLoginForm(page, ROLES.employee.email, E2E_PASSWORD);
  await expect(page).toHaveURL(/\/attendance$/);

  await page.getByRole("button", { name: "프로필 메뉴" }).first().click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/attendance");
  await expect(page).toHaveURL(/\/login$/);

  // 로그아웃은 직원의 모든 세션을 끊는다. 다른 스펙이 쓰는 저장된 로그인 상태를 새로 만든다
  await saveLoginState(browser, baseURL!, "employee");
});

test.describe("직원", () => {
  test.use({ storageState: storageStatePath("employee") });

  test("A3 로그인 상태로 /login → 내 근태", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/attendance$/);
  });

  test("A4 관리 화면에 들어갈 수 없고 메뉴도 없다", async ({ page }) => {
    for (const path of ["/admin/members", "/admin/policies", "/approvals"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/attendance$/);
    }
    await page.goto("/teams/new");
    await expect(page).not.toHaveURL(/\/teams\/new$/);

    await page.goto("/attendance");
    await expect(page.getByRole("link", { name: "휴가 승인" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "구성원 관리" })).toHaveCount(0);
  });
});

test.describe("팀장", () => {
  test.use({ storageState: storageStatePath("leader") });

  test("A5 인사담당자 화면은 막히고 휴가 승인은 열린다", async ({ page }) => {
    await page.goto("/admin/policies");
    await expect(page).toHaveURL(/\/attendance$/);
    await page.goto("/approvals");
    await expect(page.getByRole("heading", { name: "휴가 승인" })).toBeVisible();
  });
});
