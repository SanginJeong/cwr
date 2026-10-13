import * as Sentry from "@sentry/nextjs";
import { SENTRY_BASE_OPTIONS } from "@/shared/config/sentry";

// 대시보드에서 클라이언트·서버 에러를 나눠 보기 위한 태그
Sentry.init({ ...SENTRY_BASE_OPTIONS, initialScope: { tags: { layer: "server" } } });
