// 클라이언트·서버·edge의 Sentry.init이 같이 쓰는 옵션
// DSN은 Vercel Production 환경 변수에만 둔다. 값이 없으면(로컬·preview) SDK가 아무것도 보내지 않는다
export const SENTRY_BASE_OPTIONS = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  // 에러 추적만 쓴다. 트레이싱·리플레이는 켜지 않는다 (무료 할당량)
  // 구성원 개인정보가 이벤트에 실리지 않게 기본 수집을 끈다:
  // IP·사용자 정보, Supabase 인증 쿠키, 요청·응답 본문(근태·인사 데이터)
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { allow: ["user-agent", "referer"] },
    httpBodies: [],
  },
};
