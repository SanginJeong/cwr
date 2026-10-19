import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import loginWithSupabase from "./login.supabase";
import { ROUTES } from "@/shared/config/routes";

/** 세션은 Supabase가 쿠키에 저장한다 */
const usePostLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithSupabase,
    onSuccess: () => {
      // 세션이 만료돼 로그아웃 없이 다시 로그인한 경우에도 앞 계정의 캐시를 쓰지 않게 비운다.
      // 진행 중인 이 mutation(LoginForm의 onSuccess)은 남겨 두도록 조회 캐시만 비운다
      queryClient.getQueryCache().clear();
      // 로그인 후 첫 화면은 내 근태 (roadmap H3)
      router.replace(ROUTES.attendance);
    },
  });
};

export default usePostLogin;
