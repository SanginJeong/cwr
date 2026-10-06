"use client";

import { Icon } from "@/shared/ui/icon";
import { getSupabase } from "@/shared/api/supabase/client";
import { ROUTES } from "@/shared/config/routes";

interface SocialAuthSectionProps {
  mode?: "login" | "signup";
}

const SocialAuthSection = ({ mode = "login" }: SocialAuthSectionProps) => {
  const hadnleKakaoClick = () => {
    const next = encodeURIComponent(ROUTES.teams);
    void getSupabase().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}${ROUTES.authCallback}?next=${next}` },
    });
  };

  const actionText = mode === "login" ? "간편 로그인하기" : "간편 회원가입하기";

  return (
    <div className="min-w-[300px] w-full flex flex-col gap-4">
      <div className="w-full flex items-center text-md-regular tablet:text-lg-regular">
        <hr className="w-full h-[1px] bg-border-primary" aria-hidden />
        <span className="mx-6 text-text-default">OR</span>
        <hr className="w-full h-[1px] bg-border-primary" aria-hidden />
      </div>
      <div className="text-md-medium tablet:text-lg-medium flex items-center">
        <p className="flex-grow text-text-default">{actionText}</p>
        <button type="button" className="size-[42px]" onClick={hadnleKakaoClick} aria-label={`카카오로 ${actionText}`}>
          <Icon name="kakaotalk" className="size-[42px] tablet:size-[42px]" />
        </button>
      </div>
    </div>
  );
};

export default SocialAuthSection;
