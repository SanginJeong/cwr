import { cookies } from "next/headers";
import { isSupabase } from "@/shared/config/backend";
import { fetchWithServerToken } from "@/shared/api/serverFetch";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { mapMe } from "@/shared/api/supabase/mappers/user";
import type { UserResponse } from "@/shared/api/types/UserType";

/**
 * 서버 컴포넌트에서 쓰는 조회. 백엔드 스위치(shared/config/backend)에 따라 기존 API 또는 Supabase로 간다.
 */

/** 로그인 쿠키가 있는지만 본다 (검증은 middleware가 한다) */
export const hasServerSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  if (isSupabase) {
    return cookieStore.getAll().some(({ name }) => /^sb-.+-auth-token(\.0)?$/.test(name));
  }
  return !!cookieStore.get("accessToken");
};

/** 내 정보. 비로그인이거나 실패하면 null */
export const getServerMe = async (): Promise<UserResponse | null> => {
  if (isSupabase) {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.rpc("get_me");
    return error || !data ? null : mapMe(data);
  }
  const res = await fetchWithServerToken("/user");
  return res?.ok ? res.json() : null;
};

/** 내가 볼 수 있는 팀인지. 비로그인이면 null (판단 보류) */
export const canAccessTeamOnServer = async (teamId: string): Promise<boolean | null> => {
  if (isSupabase) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return null;
    const { data: group } = await supabase.from("groups").select("id").eq("id", Number(teamId)).maybeSingle();
    return !!group;
  }
  const res = await fetchWithServerToken(`/groups/${teamId}`);
  return res ? res.ok : null;
};
