import { NextResponse } from "next/server";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { isDemoEmail } from "../../_demo/data";

/** BFF 에러 응답. 화면은 message를 그대로 보여주고, field가 있으면 그 입력칸에 표시한다 */
export const errorResponse = (status: number, message: string, field?: string) =>
  NextResponse.json({ message, ...(field && { field }) }, { status });

/**
 * 요청한 사람이 인사담당자인지 사용자 세션으로 확인한다.
 * 맞으면 null, 아니면 바로 돌려줄 에러 응답.
 */
export const requireHrAdmin = async () => {
  const supabase = await getServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return errorResponse(401, "로그인이 필요합니다.");

  const { data: isHrAdmin } = await supabase.rpc("is_hr_admin");
  if (!isHrAdmin) return errorResponse(403, "인사담당자만 이용할 수 있습니다.");
  return blockDemo(claims.claims.email as string | undefined);
};

/**
 * 데모 계정(@coworkers.test)은 계정을 만들거나 로그인을 막는 일을 할 수 없다 (roadmap H6).
 * 화면은 그대로 보여주고 저장할 때 안내한다. 그 밖의 변경은 매일 리셋으로 되돌린다
 */
export const blockDemo = (email: string | undefined) =>
  isDemoEmail(email)
    ? errorResponse(403, "데모 계정에서는 직원 추가·퇴사 처리를 할 수 없어요. 둘러보기만 가능해요.")
    : null;
