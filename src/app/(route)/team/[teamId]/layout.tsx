import { redirect } from "next/navigation";
import { fetchWithServerToken } from "@/shared/api/serverFetch";
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
  const res = await fetchWithServerToken(`/groups/${teamId}`);

  if (res && !res.ok) redirect(ROUTES.teams);

  return children;
}
