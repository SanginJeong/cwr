import { randomInt } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/shared/api/supabase/admin";
import type { CompanyRole } from "@/shared/api/types/UserType";
import { errorResponse, requireHrAdmin } from "../_lib/response";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_ROLES: CompanyRole[] = ["HR_ADMIN", "EMPLOYEE"];

const LETTERS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";
const pick = (chars: string) => chars[randomInt(chars.length)];

/**
 * 임시 비밀번호 12자. 응답으로 한 번만 보여준다.
 * 앱의 비밀번호 규칙(PW_REGX: 영문·숫자·특수문자)을 만족하도록 종류마다 하나 이상 넣고 섞는다.
 * 헷갈리는 글자(l, I, O, 0, 1)는 뺀다.
 */
const createTemporaryPassword = () => {
  const all = LETTERS + DIGITS + SYMBOLS;
  const chars = [pick(LETTERS), pick(DIGITS), pick(SYMBOLS), ...Array.from({ length: 9 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

const TEAM_ROLES = ["ADMIN", "MEMBER"] as const;

/** 선택 값: 없으면 null, 양의 정수가 아니면 undefined (형식 오류) */
const optionalId = (value: unknown) =>
  value === undefined || value === null
    ? null
    : Number.isInteger(value) && (value as number) > 0
      ? (value as number)
      : undefined;

/**
 * 직원 등록 (ADR-006). 인사담당자만.
 * POST { email, nickname, companyRole?, groupId?, teamRole?, policyId? }
 *   → 201 { userId, email, nickname, companyRole, temporaryPassword }
 *
 * 트리거(handle_new_user)가 만든 프로필은 비활성이므로 여기서 활성화하고 회사 역할·정책을 정한다.
 * groupId가 있으면 그 팀에 배정한다 (teamRole: ADMIN = 팀장, 기본 MEMBER).
 * 중간에 실패하면 만든 Auth 계정을 지워서, 같은 이메일로 다시 등록할 수 있게 한다.
 */
export const POST = async (request: NextRequest) => {
  const denied = await requireHrAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const companyRole: CompanyRole = body?.companyRole ?? "EMPLOYEE";
  const groupId = optionalId(body?.groupId);
  const policyId = optionalId(body?.policyId);
  const teamRole = body?.teamRole ?? "MEMBER";

  if (!EMAIL_PATTERN.test(email)) return errorResponse(400, "이메일 형식이 올바르지 않습니다.", "email");
  if (nickname.length < 1 || nickname.length > 30) {
    return errorResponse(400, "이름은 1~30자로 입력해주세요.", "nickname");
  }
  if (!COMPANY_ROLES.includes(companyRole)) return errorResponse(400, "회사 역할이 올바르지 않습니다.");
  if (groupId === undefined || policyId === undefined || !TEAM_ROLES.includes(teamRole)) {
    return errorResponse(400, "팀·정책 값이 올바르지 않습니다.");
  }

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

  const rollback = async (message: string, status = 500) => {
    await admin.auth.admin.deleteUser(created.user.id);
    return errorResponse(status, message);
  };

  // 없는 정책이면 외래 키 위반으로 실패한다
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({ is_active: true, company_role: companyRole, policy_id: policyId })
    .eq("auth_id", created.user.id)
    .select("id")
    .single();
  if (profileError || !profile) {
    return rollback(
      profileError?.code === "23503" ? "정책을 찾을 수 없습니다." : "직원을 등록하지 못했습니다.",
      profileError?.code === "23503" ? 400 : 500,
    );
  }

  if (groupId !== null) {
    const { error: membershipError } = await admin
      .from("memberships")
      .insert({ group_id: groupId, user_id: profile.id, role: teamRole });
    if (membershipError) {
      return rollback(
        membershipError.code === "23503" ? "팀을 찾을 수 없습니다." : "팀에 배정하지 못했습니다.",
        membershipError.code === "23503" ? 400 : 500,
      );
    }
  }

  return NextResponse.json({ userId: profile.id, email, nickname, companyRole, temporaryPassword }, { status: 201 });
};
