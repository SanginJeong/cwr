"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// 루트 레이아웃까지 깨졌을 때 보이는 화면. 렌더링 에러를 Sentry로 보낸다
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        {/* App Router는 상태 코드를 알려주지 않아 0을 넘겨 기본 문구를 쓴다 */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
