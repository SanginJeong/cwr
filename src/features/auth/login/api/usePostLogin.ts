import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { setAuthCookies } from "@/shared/api/authCookies";
import tokenStorage from "@/shared/api/tokenStorage";
import postLogin from "./login";
import loginWithSupabase from "./login.supabase";
import { isSupabase } from "@/shared/config/backend";
import { LoginRequest } from "@/shared/api/types/authApi";
import { ROUTES } from "@/shared/config/routes";

const usePostLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) =>
      isSupabase ? loginWithSupabase(credentials) : postLogin(credentials),
    onSuccess: async (data) => {
      // Supabase는 세션 쿠키를 직접 관리한다
      if (!data) {
        router.replace(ROUTES.teams);
        return;
      }

      await setAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      tokenStorage.setAccessToken(data.accessToken);

      router.replace(ROUTES.teams);
    },
    onError: (error) => {
      console.error("로그인 실패", error);
    },
  });
};

export default usePostLogin;
