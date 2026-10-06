import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import postSignup from "./signup";
import signupWithSupabase from "./signup.supabase";
import { isSupabase } from "@/shared/config/backend";
import { ApiError } from "@/shared/api/supabase/errors";
import { SignUpRequest } from "@/shared/api/types/authApi";
import { setAuthCookies } from "@/shared/api/authCookies";
import { toastKit } from "@/shared/lib/toastKit";
import tokenStorage from "@/shared/api/tokenStorage";
import { ROUTES } from "@/shared/config/routes";

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
    mutationFn: async (request: SignUpRequest) => (isSupabase ? signupWithSupabase(request) : postSignup(request)),
    onSuccess: async (data) => {
      if ("needsEmailConfirmation" in data) {
        // Supabase: 세션 쿠키는 Supabase가 저장한다
        if (data.needsEmailConfirmation) {
          success("가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.");
          router.replace(ROUTES.login);
          return;
        }
      } else {
        await setAuthCookies({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        tokenStorage.setAccessToken(data.accessToken);
      }

      success("회원가입이 완료되었습니다!");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hasSeenOnboarding");
      }

      router.replace(`${ROUTES.home}?onboarding=true`);
    },
    onError: (err: AxiosError<ErrorResponse> | ApiError) => {
      if (err instanceof ApiError) {
        error(err.message);
        return;
      }

      const responseData = err.response?.data;

      const emailError = responseData?.details?.email?.message;
      const nicknameError = responseData?.details?.nickname?.message;

      const errorMessage = nicknameError || emailError || "회원가입에 실패했습니다. 다시 시도해주세요.";

      error(errorMessage);
    },
  });
};

export default usePostSignup;
