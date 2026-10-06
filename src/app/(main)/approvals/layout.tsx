import { redirect } from "next/navigation";
import { getServerMe } from "@/shared/api/serverApi";
import { ROUTES } from "@/shared/config/routes";

// 휴가 승인은 팀장(어느 팀이든 ADMIN)과 인사담당자만. 실제 권한은 review_leave_requests / decide_leave가 확인한다
export default async function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerMe();
  const canReview = me?.companyRole === "HR_ADMIN" || me?.memberships.some((m) => m.role === "ADMIN");
  if (!canReview) redirect(ROUTES.attendance);
  return children;
}
