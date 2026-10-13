import { requireHrAdmin } from "../_lib/response";

/**
 * Sentry 연결 확인용. 인사담당자로 로그인한 채 열면 서버 에러를 일부러 낸다 (docs/monitoring.md)
 * 원본 소스 위치가 이 파일로 찍히면 소스맵 업로드까지 된 것이다
 */
export async function GET() {
  const denied = await requireHrAdmin();
  if (denied) return denied;

  throw new Error("Sentry 서버 에러 확인용 (monitoring-check)");
}
