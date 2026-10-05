// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * FSD 의존 규칙 (docs/decisions/ADR-001-fsd-folder-structure.md)
 * - 슬라이스 밖에서는 public API(index.ts)로만 import: @/entities/user (O), @/entities/user/api/useGetUser (X)
 * - 레이어는 아래 방향으로만 import: app → views → widgets → features → entities → shared
 * - 같은 레이어의 다른 슬라이스 import 금지 (슬라이스 내부는 상대경로 사용)
 */
const LAYERS = ["shared", "entities", "features", "widgets", "views", "app"];
const deepImportPatterns = [
  {
    group: ["@/entities/*/**", "@/widgets/*/**", "@/views/*/**", "@/features/*/*/**", "@/shared/ui/*/**"],
    message: "슬라이스의 public API(index.ts)로 import하세요.",
  },
];
const fsdLayerRule = (layer) => {
  const forbidden = LAYERS.slice(LAYERS.indexOf(layer) + (layer === "shared" ? 1 : 0));
  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...deepImportPatterns,
            {
              group: forbidden.flatMap((l) => [`@/${l}`, `@/${l}/**`]),
              message: `${layer} 레이어는 같은 레이어의 다른 슬라이스나 상위 레이어를 import할 수 없습니다.`,
            },
          ],
        },
      ],
    },
  };
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-var": "error",
      "no-restricted-imports": ["error", { patterns: deepImportPatterns }],
    },
  },
  ...["shared", "entities", "features", "widgets", "views"].map(fsdLayerRule),
  // npm run db:types로 생성하는 파일
  { ignores: ["src/shared/api/supabase/database.types.ts"] },
]);

export default eslintConfig;
