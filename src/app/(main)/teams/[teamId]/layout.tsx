import { redirect } from "next/navigation";
import { canAccessTeamOnServer } from "@/shared/api/serverApi";
import { ROUTES } from "@/shared/config/routes";

// 존재하지 않거나 접근할 수 없는 팀 ID면 팀 목록으로 보낸다
export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const canAccess = await canAccessTeamOnServer(teamId);

  if (canAccess === false) redirect(ROUTES.teams);

  return children;
}
