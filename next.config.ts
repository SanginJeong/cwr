import type { NextConfig } from "next";

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

export default nextConfig;
