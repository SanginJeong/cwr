import { test as setup } from "@playwright/test";
import { ROLES, assertLocalSupabase, reseed, saveLoginState, type Role } from "./support";

// 시드 → 역할별로 로그인 폼으로 로그인해 세션 쿠키를 저장한다. 스펙은 이 상태로 시작한다
setup("테스트 데이터와 역할별 로그인 상태", async ({ browser, baseURL }) => {
  setup.setTimeout(180_000);
  assertLocalSupabase();
  await reseed();

  for (const role of Object.keys(ROLES) as Role[]) {
    await saveLoginState(browser, baseURL!, role);
  }
});
