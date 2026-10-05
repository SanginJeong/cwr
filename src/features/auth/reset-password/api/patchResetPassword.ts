import instance from "@/shared/api/instance";
import { PatchResetPasswordRequest, PatchResetPasswordResponse } from "@/shared/api/types/authApi";

const patchResetPassword = async (request: PatchResetPasswordRequest): Promise<PatchResetPasswordResponse> => {
  const { data } = await instance.patch<PatchResetPasswordResponse>("user/reset-password", request);
  return data;
};

export default patchResetPassword;
