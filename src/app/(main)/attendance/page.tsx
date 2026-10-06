import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 내 근태",
  description: "출퇴근 기록과 근태 판정, 휴가 신청을 한눈에 확인하세요.",
};

export { AttendancePage as default } from "@/views/attendance";
