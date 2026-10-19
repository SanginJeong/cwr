import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 계정 설정",
  description: "내 이름, 프로필 사진, 비밀번호를 바꿉니다.",
};

export { AccountPage as default } from "@/views/account";
