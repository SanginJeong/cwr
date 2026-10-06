import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import loginWithSupabase from "./login.supabase";
import { ROUTES } from "@/shared/config/routes";

/** 세션은 Supabase가 쿠키에 저장한다 */
const usePostLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: loginWithSupabase,
    onSuccess: () => {
      // 로그인 후 첫 화면은 내 근태 (roadmap H3)
      router.replace(ROUTES.attendance);
    },
  });
};

export default usePostLogin;
