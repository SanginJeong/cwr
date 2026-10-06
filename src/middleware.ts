import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ONLY_ROUTES, PROTECTED_ROUTES, ROUTES } from "@/shared/config/routes";
import { updateSupabaseSession } from "@/shared/api/supabase/middleware";

// 로그인 여부로만 리다이렉트한다. 팀 존재 확인 등 API 호출이 필요한 검사는
// 서버 컴포넌트(views/no-team, app/(main)/teams/[teamId]/layout.tsx)에서 한다.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const { response, isLoggedIn } = await updateSupabaseSession(req);

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, req.url));
    // 갱신된 세션 쿠키를 리다이렉트 응답에도 옮긴다
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // 이미 로그인한 유저가 로그인 페이지에 오면 첫 화면(내 근태)으로
  // Supabase는 재설정 메일 링크로 로그인된 상태에서 새 비밀번호를 입력하므로 재설정 페이지는 열어 둔다
  const authOnlyRoutes = AUTH_ONLY_ROUTES.filter((route) => route !== ROUTES.resetPassword);
  if (isLoggedIn && authOnlyRoutes.includes(pathname)) {
    return redirectTo(ROUTES.attendance);
  }

  // 비로그인 유저 -> 로그인 필요한 페이지 접근 시 차단
  if (!isLoggedIn && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return redirectTo(ROUTES.login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
