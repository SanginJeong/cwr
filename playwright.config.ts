import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

/**
 * E2E (ADR-008, docs/roadmap-e2e.md).
 * Supabase 로컬 스택의 값(.env.e2e, `npm run e2e:env`로 생성)으로 앱을 띄운다. 원격 DB에는 닿지 않는다.
 */
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");

const PORT = 3100;
const isCI = !!process.env.CI;

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

/** 스크린샷을 비교할 브라우저. 데스크톱 3종 + iPhone 13 WebKit(보이는 영역 390×664. 주소창을 빼서 100vh 문제가 드러난다) */
const VISUAL_BROWSERS = [
  { name: "chromium", device: { ...devices["Desktop Chrome"], viewport: DESKTOP_VIEWPORT } },
  { name: "webkit", device: { ...devices["Desktop Safari"], viewport: DESKTOP_VIEWPORT } },
  { name: "firefox", device: { ...devices["Desktop Firefox"], viewport: DESKTOP_VIEWPORT } },
  { name: "mobile-webkit", device: devices["iPhone 13"] },
];

export default defineConfig({
  testDir: "./e2e",
  // 데모 계정 3개를 모든 스펙이 같이 쓰고 데이터를 바꾸므로 직렬로 돈다 (ADR-008 §5)
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "desktop",
      testMatch: /specs\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: "mobile",
      testMatch: /mobile\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    // 크로스 브라우징 스크린샷 (docs/cross-browser-analysis.md). 기능 스펙은 Chromium에서만 돌고,
    // e2e/visual만 4개 브라우저에서 돈다. 기준 이미지는 브라우저별로 따로 둔다 ({이름}-{프로젝트}-linux.png)
    ...VISUAL_BROWSERS.map(({ name, device }) => ({
      name: `visual-${name}`,
      testMatch: /visual\/.*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...device },
    })),
  ],
  webServer: {
    // CI는 빌드해서 띄우고, 로컬은 개발 서버로 (이미 3100에 떠 있으면 재사용)
    command: isCI ? `npm run build && npx next start -p ${PORT}` : `npx next dev --webpack -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !isCI,
    timeout: 240_000,
    // .env.e2e 값이 .env(원격 DB)보다 우선한다 (Next는 이미 있는 환경변수를 덮어쓰지 않는다)
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
  },
});
