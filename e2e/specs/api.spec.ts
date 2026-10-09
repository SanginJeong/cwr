import { expect, resetDemo, test } from "../support";

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
