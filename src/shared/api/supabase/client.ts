import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저(클라이언트 컴포넌트, 훅)에서 쓰는 Supabase 클라이언트.
 * 세션은 쿠키에 저장되어 서버 컴포넌트·middleware와 공유된다.
 */
let client: SupabaseClient | undefined;

export const getSupabase = (): SupabaseClient => {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
};

/** 쿠키에 Supabase 세션이 있는지 (동기). 로그인 여부로 쿼리를 켤지 정할 때만 쓴다 */
export const hasSupabaseSession = () =>
  typeof document !== "undefined" && /(^|; )sb-[^=]+-auth-token(\.0)?=/.test(document.cookie);
