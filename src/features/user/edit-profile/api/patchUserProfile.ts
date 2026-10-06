import { PatchUserProfileRequest, PatchUserProfileResponse } from "@/shared/api/types/userApi";
import patchUserProfileWithSupabase from "./patchUserProfile.supabase";

const patchUserProfile = async (request: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  return patchUserProfileWithSupabase(request);
};

export default patchUserProfile;
