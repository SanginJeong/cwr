import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ONLY_ROUTES, PROTECTED_ROUTES, ROUTES } from "@/shared/config/routes";

export async function middleware(req: NextRequest) {
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

  // 소속팀 없는 페이지 -> 유저정보 검사 -> 리다이렉트
  if (token && req.nextUrl.pathname === ROUTES.teams) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const groupId = data.memberships?.[0]?.groupId;

      if (groupId) {
        return NextResponse.redirect(new URL(ROUTES.team(groupId), req.url));
      }
    }
  }

  // 존재하지 않는 groupID URL에 입력시
  if (token && req.nextUrl.pathname.startsWith("/team/")) {
    const teamId = req.nextUrl.pathname.split("/")[2];

    if (!teamId) {
      return NextResponse.next();
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL(ROUTES.teams, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/team/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
