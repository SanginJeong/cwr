import path from "node:path";
import { defineConfig } from "vitest/config";

// 순수 함수 단위 테스트 (정책 엔진 등). DB 테스트는 npm run test:db (PGlite)
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "e2e/seed/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
