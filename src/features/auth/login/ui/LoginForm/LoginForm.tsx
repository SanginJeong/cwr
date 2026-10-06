"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import useForm from "@/shared/lib/useForm/useForm";
import useEmailStore from "../../model/useEmailStore";
import { OverlayLoading } from "@/shared/ui/overlay-loading";
import { ValidationRules } from "@/shared/api/types/AuthType";
import usePostLogin from "../../api/usePostLogin";
import ResetPassword from "../ResetPassword/ResetPassword";
import { Input } from "@/shared/ui/input";
import { InputPassword } from "@/shared/ui/input";
import { BaseButton } from "@/shared/ui/button";
import { toastKit } from "@/shared/lib/toastKit";
import { validateEmail, validatePassword } from "@/shared/lib/Validation";

const loginRules: ValidationRules = {
  email: (value) => validateEmail(value),
  password: (value) => validatePassword(value),
};

const LoginForm = () => {
  const [isOpen, setIsOpen] = useState(false);

  const isInitialized = useRef(false);

  const { mutateAsync: postLogin } = usePostLogin();

  const { email, isRemembered, setEmail, toggleRemember } = useEmailStore();

  const { success, error } = toastKit();

  const { register, errors, handleSubmit, meta, setValue } = useForm({
    initialValues: { email: "", password: "" },
    validationRules: loginRules,
    keepLockOnSuccess: true,
    onSubmit: async (values) => {
      if (isRemembered) {
        setEmail(values.email);
      }
      await postLogin(
        { email: values.email, password: values.password },
        {
          onSuccess: () => {
            success("로그인되었습니다.");
          },
          onError: (err) => {
            error(err.message || "이메일 혹은 비밀번호를 확인해주세요.");
          },
        },
      );
    },
  });

  useEffect(() => {
    if (isInitialized.current || !isRemembered || !email) return;
    setValue("email", email);

    isInitialized.current = true;
  }, [email, isRemembered, setValue]);

  return (
    <>
      <form onSubmit={handleSubmit} className="relative min-w-[300px] w-full mt-8 mb-10 gap-3 flex flex-col">
        {meta.isLoading && <OverlayLoading />}
        <div className="flex-col-center gap-6">
          <Input
            label="이메일"
            type="email"
            {...register("email")}
            placeholder="이메일을 입력해주세요."
            error={errors.email}
            minLength={4}
            maxLength={30}
          />
          <InputPassword
            label="비밀번호"
            {...register("password")}
            placeholder="비밀번호을 입력해주세요."
            error={errors.password}
            minLength={8}
            maxLength={20}
          />
        </div>
        <div className="flex justify-between text-md-medium tablet:text-lg-medium">
          <button type="button" className="flex items-center gap-1" onClick={toggleRemember}>
            <Icon name={isRemembered ? "checkboxActive" : "checkboxDefault"} className="size-5 tablet:size-5" />
            <span>이메일 기억하기</span>
          </button>
          <button type="button" className="text-brand-primary" onClick={() => setIsOpen(true)}>
            비밀번호를 잊으셨나요?
          </button>
        </div>
        <div className="text-lg-semibold flex-col-center gap-6 mt-10">
          <BaseButton type="submit" variant="solid" size="large" disabled={!meta.isValid || meta.isLoading}>
            {meta.isLoading ? "로그인 중..." : "로그인"}
          </BaseButton>
          {/* 공개 가입은 없다. 계정은 인사담당자가 만든다 (ADR-006) */}
          <p className="text-md-medium text-text-default">계정이 없다면 인사담당자에게 문의해주세요.</p>
        </div>
      </form>
      <ResetPassword isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default LoginForm;
