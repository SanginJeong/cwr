import { redirect } from "next/navigation";
import { isServerHrAdmin } from "@/shared/api/serverApi";
import { ROUTES } from "@/shared/config/routes";

// 팀 수정은 인사담당자만 (ADR-006). 실제 권한은 groups의 RLS가 확인한다
export default async function TeamEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  if (!(await isServerHrAdmin())) redirect(ROUTES.team(teamId));
  return children;
}
