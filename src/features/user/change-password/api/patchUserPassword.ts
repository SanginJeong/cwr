import { PatchUserPasswordRequest, PatchUserPasswordResponse } from "@/shared/api/types/userApi";
import patchUserPasswordWithSupabase from "./patchUserPassword.supabase";

const patchUserPassword = async (request: PatchUserPasswordRequest): Promise<PatchUserPasswordResponse> => {
  return patchUserPasswordWithSupabase(request);
};

export default patchUserPassword;
