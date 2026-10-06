import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import signupWithSupabase from "./signup.supabase";
import { toastKit } from "@/shared/lib/toastKit";
import { ROUTES } from "@/shared/config/routes";

const usePostSignup = () => {
  const router = useRouter();

  const { success, error } = toastKit();

  return useMutation({
    mutationFn: signupWithSupabase,
    onSuccess: ({ needsEmailConfirmation }) => {
      // 대시보드에서 Confirm email을 켜두면 세션 없이 가입되고 확인 메일이 간다
      if (needsEmailConfirmation) {
        success("가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해주세요.");
        router.replace(ROUTES.login);
        return;
      }

      success("회원가입이 완료되었습니다!");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hasSeenOnboarding");
      }

      router.replace(`${ROUTES.home}?onboarding=true`);
    },
    onError: (err: Error) => {
      error(err.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
    },
  });
};

export default usePostSignup;
