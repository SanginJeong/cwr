import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError } from "@/shared/api/supabase/errors";
import { PatchUserPasswordRequest, PatchUserPasswordResponse } from "@/shared/api/types/userApi";

const patchUserPasswordWithSupabase = async ({
  password,
}: PatchUserPasswordRequest): Promise<PatchUserPasswordResponse> => {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) {
    const message =
      error.code === "same_password" ? "이전과 다른 비밀번호를 입력해주세요." : "비밀번호 변경에 실패했습니다.";
    throw new ApiError(message, error.status ?? 400);
  }
  return { message: "비밀번호가 변경되었습니다." };
};

export default patchUserPasswordWithSupabase;
