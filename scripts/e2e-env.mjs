/* eslint-disable no-console -- 터미널에 결과를 출력하는 CLI 스크립트 */
// Supabase 로컬 스택(supabase start)의 주소와 키로 .env.e2e를 만든다 (ADR-008).
// E2E는 이 파일의 값으로 앱을 띄우므로 원격(운영·데모) DB에 닿지 않는다.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// CI는 supabase/setup-cli로 설치한 supabase를, 로컬은 npx를 쓴다
const supabase = process.env.SUPABASE_BIN ?? "npx supabase";
const raw = execSync(`${supabase} status -o env`, { encoding: "utf8" });
const env = Object.fromEntries(
  raw
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);

const url = env.API_URL;
const anon = env.ANON_KEY ?? env.PUBLISHABLE_KEY;
const service = env.SERVICE_ROLE_KEY ?? env.SECRET_KEY;
if (!url || !anon || !service) {
  console.error(
    "supabase status에서 API_URL·ANON_KEY·SERVICE_ROLE_KEY를 찾지 못했습니다. supabase start를 먼저 실행하세요.",
  );
  process.exit(1);
}

writeFileSync(
  ".env.e2e",
  [
    `NEXT_PUBLIC_SUPABASE_URL=${url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
    `SUPABASE_SERVICE_ROLE_KEY=${service}`,
    "CRON_SECRET=e2e-local-secret",
    "",
  ].join("\n"),
);
console.log(`.env.e2e 작성: ${url}`);
