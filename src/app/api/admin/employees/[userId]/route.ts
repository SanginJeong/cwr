import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/shared/api/supabase/admin";
import { toApiError } from "@/shared/api/supabase/errors";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { blockDemo, errorResponse } from "../../_lib/response";

/** 사실상 영구 차단 (100년) */
const BAN_FOREVER = "876000h";

/**
 * 퇴사 처리와 복직 (ADR-006).
 * PATCH { isActive } → 200 { userId, isActive }
 *
 * 권한 확인과 DB 변경은 사용자 세션으로 set_employee_active RPC가 한다 (인사담당자만, 본인 제외).
 * 그다음 service role로 로그인을 차단(ban)하거나 푼다. 차단이 실패해도 DB가 비활성 계정을 막는다.
 */
export const PATCH = async (request: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
  const userId = Number((await params).userId);
  const body = await request.json().catch(() => null);
  if (!Number.isInteger(userId) || typeof body?.isActive !== "boolean") {
    return errorResponse(400, "요청 형식이 올바르지 않습니다.");
  }
  const isActive: boolean = body.isActive;

  const supabase = await getServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const demoBlocked = blockDemo(claims?.claims.email as string | undefined);
  if (demoBlocked) return demoBlocked;

  const { data: authId, error } = await supabase.rpc("set_employee_active", {
    p_user_id: userId,
    p_active: isActive,
  });
  if (error || !authId) {
    const apiError = toApiError(error ?? { message: "" }, "퇴사 처리에 실패했습니다.");
    const messageByStatus: Record<number, string> = {
      403: "인사담당자만 이용할 수 있습니다.",
      404: "직원을 찾을 수 없습니다.",
    };
    return errorResponse(apiError.status, messageByStatus[apiError.status] ?? apiError.message);
  }

  const { error: banError } = await getAdminSupabase().auth.admin.updateUserById(authId, {
    ban_duration: isActive ? "none" : BAN_FOREVER,
  });
  if (banError) {
    return errorResponse(
      500,
      isActive
        ? "복직은 되었지만 로그인 차단을 풀지 못했습니다. 다시 시도해주세요."
        : "퇴사 처리는 되었지만 로그인 차단에 실패했습니다. 다시 시도해주세요.",
    );
  }

  return NextResponse.json({ userId, isActive });
};
