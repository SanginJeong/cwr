"use client";

import { toastKit } from "@/shared/lib/toastKit";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { getSupabase } from "@/shared/api/supabase/client";

const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success } = toastKit();

  const logout = async () => {
    await getSupabase().auth.signOut();

    // 모든 캐시를 지운다. 내 근태·히스토리처럼 사용자 id 없이 "나"로 저장한 조회가 많아,
    // 예전처럼 ["user"]만 지우면 같은 탭에서 다른 계정으로 로그인했을 때 앞 계정의 데이터가 보였다
    queryClient.clear();

    success("로그아웃 되었습니다.");

    router.replace(ROUTES.login);
  };

  return { logout };
};

export default useLogout;
