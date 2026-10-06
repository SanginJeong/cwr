import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/shared/api/supabase/admin";
import type { CompanyRole } from "@/shared/api/types/UserType";
import { errorResponse, requireHrAdmin } from "../_lib/response";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_ROLES: CompanyRole[] = ["HR_ADMIN", "EMPLOYEE"];

/** 임시 비밀번호: 영문 대소문자·숫자 12자. 응답으로 한 번만 보여준다 */
const createTemporaryPassword = () => randomBytes(9).toString("base64url").replace(/[-_]/g, "x");

/**
 * 직원 등록 (ADR-006). 인사담당자만.
 * POST { email, nickname, companyRole? } → 201 { userId, email, nickname, companyRole, temporaryPassword }
 *
 * 트리거(handle_new_user)가 만든 프로필은 비활성이므로 여기서 활성화하고 회사 역할을 정한다.
 * 팀 배정은 따로 한다 (memberships, 인사담당자 RLS).
 */
export const POST = async (request: NextRequest) => {
  const denied = await requireHrAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const companyRole: CompanyRole = body?.companyRole ?? "EMPLOYEE";

  if (!EMAIL_PATTERN.test(email)) return errorResponse(400, "이메일 형식이 올바르지 않습니다.", "email");
  if (nickname.length < 1 || nickname.length > 30) {
    return errorResponse(400, "이름은 1~30자로 입력해주세요.", "nickname");
  }
  if (!COMPANY_ROLES.includes(companyRole)) return errorResponse(400, "회사 역할이 올바르지 않습니다.");

  const admin = getAdminSupabase();

  // 닉네임이 겹치면 트리거가 계정 생성을 실패시키는데, Auth는 "Database error"로만 알려준다. 미리 확인한다
  const { data: isAvailable } = await admin.rpc("is_nickname_available", { p_nickname: nickname });
  if (!isAvailable) return errorResponse(409, "이미 사용중인 이름입니다.", "nickname");

  const temporaryPassword = createTemporaryPassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { nickname },
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists") return errorResponse(409, "이미 등록된 이메일입니다.", "email");
    return errorResponse(500, "직원을 등록하지 못했습니다.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({ is_active: true, company_role: companyRole })
    .eq("auth_id", created.user.id)
    .select("id")
    .single();
  if (profileError || !profile) {
    // 활성화하지 못한 계정은 쓸 수 없으니 지워서 같은 이메일로 다시 등록할 수 있게 한다
    await admin.auth.admin.deleteUser(created.user.id);
    return errorResponse(500, "직원을 등록하지 못했습니다.");
  }

  return NextResponse.json({ userId: profile.id, email, nickname, companyRole, temporaryPassword }, { status: 201 });
};
