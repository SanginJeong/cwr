import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { PatchUserProfileRequest, PatchUserProfileResponse } from "@/shared/api/types/userApi";

const patchUserProfileWithSupabase = async ({
  nickname,
  image,
}: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  const { error } = await getSupabase().rpc("update_my_profile", { p_nickname: nickname, p_image: image });
  if (error) throw toApiError(error, "프로필 변경에 실패했습니다.");
  return { message: "프로필이 변경되었습니다." };
};

export default patchUserProfileWithSupabase;
