import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { NextResponse, type NextRequest } from "next/server";

/**
 * middleware에서 Supabase 세션을 갱신하고 로그인 여부를 돌려준다.
 * 만료된 access token은 여기서 refresh되어 응답 쿠키에 다시 쓰인다.
 * 리다이렉트할 때도 이 response의 쿠키를 옮겨야 세션이 유지된다.
 */
export const updateSupabaseSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims는 JWT 서명을 검증한다 (쿠키 값을 그대로 믿지 않음)
  const { data } = await supabase.auth.getClaims();

  return { response, isLoggedIn: !!data?.claims, supabase };
};
