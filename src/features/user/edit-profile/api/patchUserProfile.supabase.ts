import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError, toApiError } from "@/shared/api/supabase/errors";
import { PatchUserProfileRequest, PatchUserProfileResponse } from "@/shared/api/types/userApi";

const patchUserProfileWithSupabase = async ({
  nickname,
  image,
}: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  const { error } = await getSupabase().rpc("update_my_profile", { p_nickname: nickname, p_image: image });
  // update_my_profile이 다른 사람이 쓰는 이름이면 이 문구로 막는다. 이 서비스에서 이 칸은 "이름"이라 문구를 바꾸고 입력란에 보여준다
  if (error?.message.includes("이미 사용중인 닉네임"))
    throw new ApiError("이미 사용 중인 이름이에요.", 409, "nickname");
  if (error) throw toApiError(error, "프로필 변경에 실패했습니다.");
  return { message: "프로필이 변경되었습니다." };
};

export default patchUserProfileWithSupabase;
