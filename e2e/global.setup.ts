import { test as setup } from "@playwright/test";
import { ROLES, assertLocalSupabase, resetDemo, storageStatePath, type Role } from "./support";

// 시드 → 역할별로 데모 로그인해 세션 쿠키를 저장한다. 스펙은 이 상태로 시작한다
setup("데모 데이터와 역할별 로그인 상태", async ({ playwright, baseURL }) => {
  assertLocalSupabase();
  const request = await playwright.request.newContext({ baseURL });
  await resetDemo(request);

  for (const role of Object.keys(ROLES) as Role[]) {
    const context = await playwright.request.newContext({ baseURL });
    const res = await context.post("/api/demo-login", { data: { role } });
    if (!res.ok()) throw new Error(`데모 로그인 실패(${role}): ${res.status()} ${await res.text()}`);
    await context.storageState({ path: storageStatePath(role) });
    await context.dispose();
  }
  await request.dispose();
});
