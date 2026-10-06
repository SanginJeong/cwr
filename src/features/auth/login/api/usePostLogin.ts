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
      router.replace(ROUTES.teams);
    },
  });
};

export default usePostLogin;
