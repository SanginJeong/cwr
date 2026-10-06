import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 팀 생성하기",
  description: "회사에 새 팀을 만들어보세요.",
};

export { TeamCreatePage as default } from "@/views/team-create";
