import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트, Route Handler, Server Action에서 쓰는 Supabase 클라이언트.
 * 요청마다 새로 만든다. 서버 컴포넌트에서는 쿠키를 쓸 수 없어서 setAll이 실패하는데,
 * 세션 갱신은 proxy(src/proxy.ts)가 하므로 무시해도 된다.
 */
export const getServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서 호출된 경우
          }
        },
      },
    },
  );
};
