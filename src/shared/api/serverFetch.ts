import { cookies } from "next/headers";

/**
 * 서버 컴포넌트에서 accessToken 쿠키로 백엔드 API를 호출한다.
 * 토큰이 없으면 null (보호 경로는 middleware가 먼저 /login으로 보낸다).
 */
export const fetchWithServerToken = async (path: string): Promise<Response | null> => {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token) return null;

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
};
