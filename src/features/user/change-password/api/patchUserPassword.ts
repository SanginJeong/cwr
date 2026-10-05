import instance from "@/shared/api/instance";
import { PatchUserPasswordRequest, PatchUserPasswordResponse } from "@/shared/api/types/userApi";
import patchUserPasswordWithSupabase from "./patchUserPassword.supabase";
import { isSupabase } from "@/shared/config/backend";

const patchUserPassword = async (request: PatchUserPasswordRequest): Promise<PatchUserPasswordResponse> => {
  if (isSupabase) return patchUserPasswordWithSupabase(request);

  const { data } = await instance.patch<PatchUserPasswordResponse>("/user/password", request);
  return data;
};

export default patchUserPassword;
