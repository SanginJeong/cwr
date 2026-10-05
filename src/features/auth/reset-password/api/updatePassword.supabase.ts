import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError } from "@/shared/api/supabase/errors";

/**
 * 재설정 메일 링크로 만들어진 세션에서 새 비밀번호를 저장한다.
 * 기존 API처럼 다시 로그인하게 하려고 저장 후 로그아웃한다.
 */
const updatePasswordWithSupabase = async ({ password }: { password: string }): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const message =
      error.code === "same_password" ? "이전과 다른 비밀번호를 입력해주세요." : "비밀번호 재설정에 실패했습니다.";
    throw new ApiError(message, error.status ?? 400);
  }
  await supabase.auth.signOut();
};

export default updatePasswordWithSupabase;
