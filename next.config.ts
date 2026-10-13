import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Supabase Storage 이미지 (supabase/migrations의 images 버킷)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    // 팀 이미지를 고르지 않으면 dicebear SVG를 기본 이미지로 쓴다 (features/team/create-team/lib/resolveTeamImage.ts)
    // SVG 안의 스크립트가 실행되지 않게 Next 문서의 권장 CSP를 함께 둔다
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", port: "", pathname: "/9.x/**" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, port: "", pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },

  // 구 URL 호환 (ADR-002). 문제 없으면 permanent: true로 바꾸고, 한 릴리스 이후 제거
  async redirects() {
    return [
      { source: "/team", destination: "/teams", permanent: false },
      { source: "/team-creation", destination: "/teams/new", permanent: false },
      { source: "/team/:teamId/task-list/:listId", destination: "/teams/:teamId/lists/:listId", permanent: false },
      { source: "/team/:teamId/edit", destination: "/teams/:teamId/edit", permanent: false },
      { source: "/team/:teamId", destination: "/teams/:teamId", permanent: false },
      { source: "/dashboard/write", destination: "/board/new", permanent: false },
      { source: "/dashboard/:id", destination: "/board/:id", permanent: false },
      { source: "/dashboard", destination: "/board", permanent: false },
      { source: "/my-page", destination: "/account", permanent: false },
      { source: "/my-history", destination: "/history", permanent: false },
    ];
  },

  experimental: {
    esmExternals: "loose",
  },

  webpack(config) {
    // @ts-expect-error - Next.js rule type is too complex
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.(".svg"));

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      },
    );

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

// org·project·authToken은 SENTRY_ORG·SENTRY_PROJECT·SENTRY_AUTH_TOKEN 환경 변수에서 읽는다.
// 토큰이 없으면(로컬·preview) 소스맵 업로드만 건너뛰고 빌드는 그대로 된다.
// 릴리스 이름은 Vercel의 커밋 SHA(VERCEL_GIT_COMMIT_SHA)로 자동으로 붙는다
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // 광고 차단기가 sentry.io 요청을 막지 않게 같은 도메인으로 우회한다 (proxy.ts matcher에서 제외)
  tunnelRoute: "/monitoring",
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
  },
});
