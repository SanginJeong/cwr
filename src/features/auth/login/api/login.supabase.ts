import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError } from "@/shared/api/supabase/errors";
import { LoginRequest } from "@/shared/api/types/authApi";

/** 세션은 Supabase가 쿠키에 저장한다. 기존 API처럼 토큰을 직접 다루지 않는다 */
const loginWithSupabase = async ({ email, password }: LoginRequest): Promise<void> => {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) {
    // 퇴사 처리하면 BFF가 Auth에서 로그인을 차단한다 (ADR-006)
    if (error.code === "user_banned") {
      throw new ApiError("퇴사 처리된 계정입니다. 인사담당자에게 문의해주세요.", 403);
    }
    throw new ApiError("이메일 혹은 비밀번호를 확인해주세요.", error.status ?? 400);
  }
};

export default loginWithSupabase;
