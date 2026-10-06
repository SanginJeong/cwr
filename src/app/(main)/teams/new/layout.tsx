import { redirect } from "next/navigation";
import { isServerHrAdmin } from "@/shared/api/serverApi";
import { ROUTES } from "@/shared/config/routes";

// 팀 생성은 인사담당자만 (ADR-006). 실제 권한은 create_group RPC가 확인한다
export default async function TeamNewLayout({ children }: { children: React.ReactNode }) {
  if (!(await isServerHrAdmin())) redirect(ROUTES.teams);
  return children;
}
