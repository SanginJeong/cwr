import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 로그인 페이지",
  description: "팀원들과 함께하는 일정 관리 서비스. 함께 일정을 계획하고 관리해보세요.",
  openGraph: {
    title: "Coworkers",
    description: "팀원들과 함께하는 일정 관리 서비스. 함께 일정을 계획하고 관리해보세요.",
    type: "website",
  },
};

export { default } from "@/views/login/ui/LoginPage";
