// supabase/migrations를 PGlite(WASM Postgres)에 적용하고 supabase/tests/*.test.sql을 실행한다.
// Docker나 Supabase 프로젝트 없이 스키마와 RLS를 검증하기 위한 스크립트.
//
//   npm run test:db              전체 실행
//   npm run test:db -- tasks     파일 이름에 "tasks"가 들어간 테스트만
//
// 테스트 파일은 실패하면 예외를 던지는 SQL이다. 파일마다 새 DB에서 실행한다.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = join(import.meta.dirname, "..", "supabase");
const read = (...p) => readFileSync(join(root, ...p), "utf8");
const sqlFiles = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

const shim = read("tests", "_shim.sql");
const migrations = sqlFiles("migrations").map((f) => [f, read("migrations", f)]);
const filter = process.argv[2];
const tests = sqlFiles("tests").filter((f) => f.endsWith(".test.sql") && (!filter || f.includes(filter)));

let failed = 0;
for (const file of tests) {
  const db = new PGlite();
  try {
    await db.exec(shim);
    for (const [name, sql] of migrations) {
      try {
        await db.exec(sql);
      } catch (e) {
        throw new Error(`migration ${name}: ${e.message}`);
      }
    }
    await db.exec(read("tests", file));
    console.log(`✓ ${file}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${file}\n    ${e.message}`);
  } finally {
    await db.close();
  }
}

console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
