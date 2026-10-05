import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ONLY_ROUTES, PROTECTED_ROUTES, ROUTES } from "@/shared/config/routes";

// 쿠키 유무로만 리다이렉트한다. 팀 존재 확인 등 API 호출이 필요한 검사는
// 서버 컴포넌트(views/no-team, app/(main)/teams/[teamId]/layout.tsx)에서 한다.
export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;

  const { pathname } = req.nextUrl;

  // 이미 로그인한 유저가 로그인/회원가입 페이지 접근 시 차단
  if (token && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.home, req.url));
  }

  // 비로그인 유저 -> 로그인 필요한 페이지 접근 시 차단
  if (!token && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL(ROUTES.login, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
