import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { mapMe } from "@/shared/api/supabase/mappers/user";
import { rpcJson } from "@/shared/api/supabase/types";
import { UserResponse } from "@/shared/api/types/UserType";

const getUserWithSupabase = async (): Promise<UserResponse> => {
  const { data, error } = await getSupabase().rpc("get_me");
  if (error) throw toApiError(error, "내 정보를 불러오지 못했습니다.");
  return mapMe(rpcJson("get_me", data));
};

export default getUserWithSupabase;
