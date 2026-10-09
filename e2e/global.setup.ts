import { test as setup } from "@playwright/test";
import { ROLES, assertLocalSupabase, resetDemo, saveLoginState, type Role } from "./support";

// 시드 → 역할별로 데모 로그인해 세션 쿠키를 저장한다. 스펙은 이 상태로 시작한다
setup("데모 데이터와 역할별 로그인 상태", async ({ playwright, baseURL }) => {
  assertLocalSupabase();
  const request = await playwright.request.newContext({ baseURL });
  await resetDemo(request);
  await request.dispose();

  for (const role of Object.keys(ROLES) as Role[]) {
    await saveLoginState(playwright, baseURL!, role);
  }
});
