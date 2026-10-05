import instance from "@/lib/axios";
import { PatchUserProfileRequest, PatchUserProfileResponse } from "./type";

const patchUserProfile = async (request: PatchUserProfileRequest): Promise<PatchUserProfileResponse> => {
  const { data } = await instance.patch<PatchUserProfileResponse>("/user", request);
  return data;
};

export default patchUserProfile;
