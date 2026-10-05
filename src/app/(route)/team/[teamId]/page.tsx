import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 팀 페이지",
  description: "할 일들을 생성하고, 효율적인 업무 관리를 시작해보세요.",
};

export { TeamPage as default } from "@/views/team";
