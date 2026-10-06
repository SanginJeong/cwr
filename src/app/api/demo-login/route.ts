import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/shared/api/supabase/admin";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { DEMO_ACCOUNTS, demoEmail, type DemoRole } from "../_demo/data";
import { randomPassword } from "../_demo/resetDemo";

/**
 * 원클릭 데모 로그인 (roadmap H6). POST { role: "hr" | "leader" | "employee" }
 *
 * 데모 계정의 비밀번호는 어디에도 저장하지 않는다. 로그인할 때마다 서버가 service role로 새 비밀번호를 정하고
 * 그 비밀번호로 로그인해 세션 쿠키만 넘긴다. 면접관이 비밀번호를 바꾸거나, 인사담당자 데모가 퇴사 처리해도
 * 다음 데모 로그인에서 되돌아온다.
 */
export const POST = async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const role = body?.role as DemoRole;
  if (!(role in DEMO_ACCOUNTS)) {
    return NextResponse.json({ message: "데모 역할이 올바르지 않습니다." }, { status: 400 });
  }

  const email = demoEmail(DEMO_ACCOUNTS[role]);
  const admin = getAdminSupabase();
  const { data: profile } = await admin.from("profiles").select("id, auth_id").eq("email", email).maybeSingle();
  if (!profile) {
    return NextResponse.json({ message: "데모 데이터가 아직 준비되지 않았어요." }, { status: 503 });
  }

  const password = randomPassword();
  const { error: authError } = await admin.auth.admin.updateUserById(profile.auth_id, {
    password,
    ban_duration: "none",
  });
  const { error: profileError } = await admin.from("profiles").update({ is_active: true }).eq("id", profile.id);
  if (authError || profileError) {
    return NextResponse.json({ message: "데모 계정을 준비하지 못했습니다." }, { status: 500 });
  }

  // 서버 클라이언트로 로그인하면 세션이 응답 쿠키에 쓰인다
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ message: "데모 로그인에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ role });
};
