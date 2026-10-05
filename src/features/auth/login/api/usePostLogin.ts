import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { setAuthCookies } from "@/shared/api/authCookies";
import tokenStorage from "@/shared/api/tokenStorage";
import postLogin from "./login";
import { ROUTES } from "@/shared/config/routes";

const usePostLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: postLogin,
    onSuccess: async (data) => {
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
