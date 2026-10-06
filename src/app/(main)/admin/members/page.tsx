import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 구성원 관리",
  description: "직원을 등록하고 팀·역할·근태 정책을 배정하세요.",
};

export { AdminMembersPage as default } from "@/views/admin-members";
