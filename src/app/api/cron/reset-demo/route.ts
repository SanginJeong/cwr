import { NextResponse, type NextRequest } from "next/server";
import { resetDemo } from "../../_demo/resetDemo";

// 3개월치 기록을 다시 쓰므로 기본 제한(10초)보다 길게
export const maxDuration = 60;

/**
 * 데모 데이터 리셋 (roadmap H6). 매일 새벽 Vercel Cron이 부른다 (vercel.json).
 * - 면접관이 바꾼 데모 데이터를 되돌리고, 기록을 "오늘 기준 최근 3개월"로 다시 만든다
 * - 매일 DB에 요청이 가므로 무료 플랜의 7일 비활성 일시정지도 막는다
 *
 * Vercel Cron은 CRON_SECRET이 있으면 `Authorization: Bearer <CRON_SECRET>`을 붙여 보낸다.
 * 로컬에서 처음 시드할 때도 같은 헤더로 호출한다 (supabase/README.md).
 */
export const GET = async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const summary = await resetDemo();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[reset-demo]", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "데모 데이터를 만들지 못했습니다." },
      { status: 500 },
    );
  }
};
