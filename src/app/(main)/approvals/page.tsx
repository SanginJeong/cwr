import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 휴가 승인",
  description: "팀원의 휴가 신청을 승인하거나 반려하세요.",
};

export { ApprovalsPage as default } from "@/views/approvals";
