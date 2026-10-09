import { expect, resetDemo, saveLoginState, setAccount, test } from "../support";

// 로드맵 2 §2-7. 브라우저 없이 API만

test("O1 데모 리셋은 인증 없이 부를 수 없다", async ({ request }) => {
  const res = await request.get("/api/cron/reset-demo");
  expect(res.status()).toBe(401);
});

test("O3 데모 로그인의 잘못된 역할은 400", async ({ request }) => {
  const res = await request.post("/api/demo-login", { data: { role: "ceo" } });
  expect(res.status()).toBe(400);
});

test("O2 같은 날 두 번 리셋해도 결과가 같다", async ({ request }) => {
  test.setTimeout(300_000);
  const counts = ({ users, teams, records, leaves }: Record<string, number>) => ({ users, teams, records, leaves });
  const first = counts(await resetDemo(request));
  const second = counts(await resetDemo(request));
  expect(second).toEqual(first);
});

test(
  "O4 데모 로그인은 퇴사 처리와 비밀번호 변경을 되돌린다",
  { tag: "@p2" },
  async ({ request, playwright, baseURL }) => {
    // 면접관이 인사담당자 데모로 다른 데모 계정을 막아도(실제로는 H6에서 막힘) 다음 데모 로그인은 들어가져야 한다
    await setAccount("employee@coworkers.test", { password: "changed-Password-1!", active: false });

    const res = await request.post("/api/demo-login", { data: { role: "employee" } });
    expect(res.status(), await res.text()).toBe(200);
    const attendance = await request.get("/attendance", { maxRedirects: 0 });
    expect(attendance.status()).toBe(200);

    // 로그인 차단으로 저장된 직원 세션이 끊겼을 수 있어 새로 만든다
    await saveLoginState(playwright, baseURL!, "employee");
  },
);
