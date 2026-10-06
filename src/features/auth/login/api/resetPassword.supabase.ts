import { getSupabase } from "@/shared/api/supabase/client";
import { toApiError } from "@/shared/api/supabase/errors";
import { ResetPasswordRequest } from "@/shared/api/types/authApi";
import { ROUTES } from "@/shared/config/routes";

/**
 * 재설정 메일 발송. 메일 링크 → /auth/callback(세션 생성) → /reset-password에서 새 비밀번호 입력.
 * Supabase는 가입되지 않은 이메일이어도 성공으로 응답한다 (이메일 존재 여부를 노출하지 않음).
 * PKCE 방식이라 메일을 요청한 브라우저에서 링크를 열어야 한다.
 */
const sendResetPasswordEmailWithSupabase = async ({ email, redirectUrl }: ResetPasswordRequest): Promise<void> => {
  const next = encodeURIComponent(ROUTES.resetPassword);
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectUrl}${ROUTES.authCallback}?next=${next}`,
  });
  if (error) throw toApiError(error, "메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.");
};

export default sendResetPasswordEmailWithSupabase;
