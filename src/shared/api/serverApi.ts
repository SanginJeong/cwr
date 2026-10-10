import { cache } from "react";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/shared/api/supabase/server";
import { mapMe } from "@/shared/api/supabase/mappers/user";
import { rpcJson } from "@/shared/api/supabase/types";
import type { UserResponse } from "@/shared/api/types/UserType";

/**
 * 서버 컴포넌트에서 쓰는 조회.
 */

/** 로그인 쿠키가 있는지만 본다 (검증은 proxy가 한다) */
export const hasServerSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return cookieStore.getAll().some(({ name }) => /^sb-.+-auth-token(\.0)?$/.test(name));
};

/** 내 정보. 비로그인이거나 실패하면 null. 루트 레이아웃과 하위 레이아웃이 함께 불러도 요청당 한 번만 조회한다 */
export const getServerMe = cache(async (): Promise<UserResponse | null> => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("get_me");
  return error || !data ? null : mapMe(rpcJson("get_me", data));
});

/** 내가 볼 수 있는 팀인지. 비로그인이면 null (판단 보류) */
export const canAccessTeamOnServer = async (teamId: string): Promise<boolean | null> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const { data: group } = await supabase.from("groups").select("id").eq("id", Number(teamId)).maybeSingle();
  return !!group;
};

/** 내가 볼 수 있는 첫 번째 팀. 인사담당자는 소속이 없어도 회사의 모든 팀을 본다 (RLS) */
export const getServerFirstVisibleTeamId = async (): Promise<number | null> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("groups").select("id").order("id").limit(1).maybeSingle();
  return data?.id ?? null;
};

/** 인사담당자인지. 비로그인이거나 실패하면 false */
export const isServerHrAdmin = async (): Promise<boolean> => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.rpc("is_hr_admin");
  return data === true;
};
