import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sprint-fe-project.s3.ap-northeast-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // 구 URL 호환 (ADR-002). 문제 없으면 permanent: true로 바꾸고, 한 릴리스 이후 제거
  async redirects() {
    return [
      { source: "/team", destination: "/teams", permanent: false },
      { source: "/team-creation", destination: "/teams/new", permanent: false },
      { source: "/team-join", destination: "/teams/join", permanent: false },
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
