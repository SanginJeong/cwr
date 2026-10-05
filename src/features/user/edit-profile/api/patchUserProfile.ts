import instance from "@/shared/api/instance";
import { PatchUserProfileRequest, PatchUserProfileResponse } from "@/shared/api/types/userApi";
import patchUserProfileWithSupabase from "./patchUserProfile.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchUserProfile = async (request: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  if (isSupabase) return patchUserProfileWithSupabase(request);

  const { data } = await instance.patch<PatchUserProfileResponse>("/user", request);
  return data;
};

export default patchUserProfile;
