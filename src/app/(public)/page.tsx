import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 출퇴근·휴가 관리",
  description: "출근 버튼 하나로 근태를 기록하고, 휴가 신청부터 승인까지 한 곳에서 끝내요.",
};

export { LandingPage as default } from "@/views/landing";
