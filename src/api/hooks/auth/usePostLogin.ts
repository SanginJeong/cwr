import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { setAuthCookies } from "@/utils/setAuthCookies";
import tokenStorage from "@/utils/tokenStorage";
import postLogin from "@/api/axios/auth/login";

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

      router.replace("/team");
    },
    onError: (error) => {
      console.error("로그인 실패", error);
    },
  });
};

export default usePostLogin;
