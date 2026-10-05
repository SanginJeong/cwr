import instance from "@/shared/api/instance";
import { PatchUserProfileRequest, PatchUserProfileResponse } from "@/shared/api/types/userApi";

const patchUserProfile = async (request: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  const { data } = await instance.patch<PatchUserProfileResponse>("/user", request);
  return data;
};

export default patchUserProfile;
