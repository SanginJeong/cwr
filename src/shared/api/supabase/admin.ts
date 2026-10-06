import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * service role 클라이언트. RLS를 우회하고 auth.admin(계정 생성, 로그인 차단)을 쓸 수 있다.
 * Route Handler(BFF)에서만 쓴다. 키는 NEXT_PUBLIC_ 접두사가 없어서 브라우저 번들에 들어가지 않는다.
 * 권한 확인은 호출하기 전에 사용자 세션으로 한다 (is_hr_admin 등).
 */
export const getAdminSupabase = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
