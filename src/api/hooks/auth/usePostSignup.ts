import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import postSignup from "@/api/axios/auth/signup";
import { setAuthCookies } from "@/utils/setAuthCookies";
import { toastKit } from "@/utils/toastKit";
import tokenStorage from "@/utils/tokenStorage";

type ErrorResponse = {
  message?: string;
  details?: {
    email?: {
      message: string;
    };
    nickname?: { message: string };
  };
};

const usePostSignup = () => {
  const router = useRouter();

  const { success, error } = toastKit();

  return useMutation({
    mutationFn: postSignup,
    onSuccess: async (data) => {
      await setAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      tokenStorage.setAccessToken(data.accessToken);

      success("회원가입이 완료되었습니다!");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hasSeenOnboarding");
      }

      router.replace("/?onboarding=true");
    },
    onError: (err: AxiosError<ErrorResponse>) => {
      const responseData = err.response?.data;

      const emailError = responseData?.details?.email?.message;
      const nicknameError = responseData?.details?.nickname?.message;

      const errorMessage = nicknameError || emailError || "회원가입에 실패했습니다. 다시 시도해주세요.";

      error(errorMessage);
    },
  });
};

export default usePostSignup;
