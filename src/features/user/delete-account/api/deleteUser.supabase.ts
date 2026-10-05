import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";

const deleteUserWithSupabase = async (): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("delete_account");
  if (error) throw toApiError(error, "회원 탈퇴에 실패했습니다.");
  // 계정이 지워져도 브라우저 쿠키의 세션은 남아 있으므로 지운다
  await supabase.auth.signOut({ scope: "local" });
};

export default deleteUserWithSupabase;
