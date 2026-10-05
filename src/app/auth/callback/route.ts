import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { ROUTES } from "@/shared/config/routes";

/**
 * Supabase 인증 콜백 (카카오 로그인, 비밀번호 재설정 메일 링크).
 * ?code=를 세션으로 바꿔 쿠키에 저장한 뒤 ?next=로 보낸다.
 */
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.teams;
  // 외부 주소로 보내지 않는다 (//evil.com 같은 값 차단)
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.teams;

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth_callback`);
};
