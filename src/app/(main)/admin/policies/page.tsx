import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 근태 정책",
  description: "자율·코어타임·고정 근무 정책을 만들고 기본 정책을 정하세요.",
};

export { AdminPoliciesPage as default } from "@/views/admin-policies";
