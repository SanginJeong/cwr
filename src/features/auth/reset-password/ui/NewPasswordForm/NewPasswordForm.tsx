"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useForm from "@/shared/lib/useForm/useForm";
import usePatchResetPassword from "../../api/usePatchResetPassword";
import { InputPassword } from "@/shared/ui/input";
import { BaseButton } from "@/shared/ui/button";
import { OverlayLoading } from "@/shared/ui/overlay-loading";
import { toastKit } from "@/shared/lib/toastKit";
import { validatePassword, validatePasswordConfirm } from "@/shared/lib/Validation";
import { ROUTES } from "@/shared/config/routes";
import { isSupabase } from "@/shared/config/backend";
import { getSupabase } from "@/shared/api/supabase/client";

const NewPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { error } = toastKit();

  useEffect(() => {
    // Supabase: 메일 링크를 거쳐 오면 /auth/callback에서 세션이 만들어져 있다. 토큰 대신 세션을 확인한다
    if (isSupabase) {
      void getSupabase()
        .auth.getUser()
        .then(({ data }) => {
          if (!data.user) {
            error("재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.");
            router.replace(ROUTES.login);
          }
        });
      return;
    }
    if (!token) {
      error("유효하지 않은 접근입니다.");
      router.replace(ROUTES.home);
    }
  }, [token, router, error]);

  const { mutateAsync: resetPassword } = usePatchResetPassword();

  const { register, errors, handleSubmit, meta } = useForm({
    initialValues: { password: "", passwordConfirm: "" },
    keepLockOnSuccess: true,
    validationRules: {
      password: validatePassword,
      passwordConfirm: (value, formData) => validatePasswordConfirm(formData?.password ?? "", value),
    },
    validationTriggers: {
      password: ["passwordConfirm"],
    },
    onSubmit: async (values) => {
      if (!token && !isSupabase) {
        error("토큰이 유효하지 않습니다.");
        throw new Error("Token missing");
      }

      await resetPassword({
        password: values.password,
        passwordConfirmation: values.passwordConfirm,
        token: token ?? "",
      });
    },
  });

  return (
    <form onSubmit={handleSubmit} className="relative w-full mt-8 gap-3 flex flex-col">
      {meta.isLoading && <OverlayLoading />}
      <div className="flex-col-center gap-6">
        <InputPassword
          label="새 비밀번호"
          {...register("password")}
          placeholder="비밀번호 (영문, 숫자, 특수문자 포함)를 입력해주세요."
          error={errors.password}
          minLength={8}
          maxLength={20}
        />
        <InputPassword
          label="비밀번호 확인"
          {...register("passwordConfirm")}
          placeholder="새 비밀번호를 다시 한번 입력해주세요."
          error={errors.passwordConfirm}
          minLength={8}
          maxLength={20}
        />
      </div>
      <div className="text-lg-semibold flex-col-center gap-6 mt-10">
        <BaseButton type="submit" variant="solid" size="large" disabled={!meta.isValid || meta.isLoading}>
          {meta.isLoading ? "재설정 중..." : "재설정"}
        </BaseButton>
      </div>
    </form>
  );
};

export default NewPasswordForm;
