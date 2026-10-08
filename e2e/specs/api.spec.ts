import { expect, test } from "../support";

// 로드맵 2 §2-7. 브라우저 없이 API만

test("O1 데모 리셋은 인증 없이 부를 수 없다", async ({ request }) => {
  const res = await request.get("/api/cron/reset-demo");
  expect(res.status()).toBe(401);
});

test("O3 데모 로그인의 잘못된 역할은 400", async ({ request }) => {
  const res = await request.post("/api/demo-login", { data: { role: "ceo" } });
  expect(res.status()).toBe(400);
});
