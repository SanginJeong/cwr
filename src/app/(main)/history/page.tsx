import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 마이 히스토리",
  description: "내가 완료한 할 일을 모아 봅니다.",
};

export { HistoryPage as default } from "@/views/history";
