import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coworkers | 휴가 승인",
  description: "회사 전체의 휴가 신청을 승인하거나 반려하세요.",
};

// 팀장 화면(/approvals)을 그대로 쓴다. 인사담당자에게는 review_leave_requests가 회사 전체를 돌려준다
export { ApprovalsPage as default } from "@/views/approvals";
