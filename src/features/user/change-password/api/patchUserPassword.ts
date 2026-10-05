import instance from "@/shared/api/instance";
import { PatchUserPasswordRequest, PatchUserPasswordResponse } from "@/shared/api/types/userApi";

const patchUserPassword = async (request: PatchUserPasswordRequest): Promise<PatchUserPasswordResponse> => {
  const { data } = await instance.patch<PatchUserPasswordResponse>("/user/password", request);
  return data;
};

export default patchUserPassword;
