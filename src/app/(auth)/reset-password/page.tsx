import type { Metadata } from "next";

// (auth) 레이아웃의 "로그인 페이지" 제목을 덮어쓴다
export const metadata: Metadata = {
  title: "Coworkers | 비밀번호 재설정",
  description: "메일로 받은 링크로 새 비밀번호를 정합니다.",
};

export { ResetPasswordPage as default } from "@/views/reset-password";
