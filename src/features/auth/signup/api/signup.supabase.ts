import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError } from "@/shared/api/supabase/errors";
import { SignUpRequest } from "@/shared/api/types/authApi";

export interface SupabaseSignUpResult {
  /** 대시보드에서 Confirm email을 켜두면 세션 없이 가입되고 확인 메일이 간다 */
  needsEmailConfirmation: boolean;
}

const signupWithSupabase = async ({ email, nickname, password }: SignUpRequest): Promise<SupabaseSignUpResult> => {
  const supabase = getSupabase();

  const { data: available } = await supabase.rpc("is_nickname_available", { p_nickname: nickname });
  if (available === false) {
    throw new ApiError("이미 사용중인 닉네임입니다.", 409, "nickname");
  }

  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname } } });

  if (error) {
    if (error.code === "user_already_exists") {
      throw new ApiError("이미 사용중인 이메일입니다.", 409, "email");
    }
    // 닉네임 확인과 가입 사이에 같은 닉네임이 먼저 가입된 경우 (handle_new_user 트리거가 거부)
    if (error.message.includes("Database error saving new user")) {
      throw new ApiError("이미 사용중인 닉네임입니다.", 409, "nickname");
    }
    throw new ApiError("회원가입에 실패했습니다. 다시 시도해주세요.", error.status ?? 500);
  }

  return { needsEmailConfirmation: !data.session };
};

export default signupWithSupabase;
