import * as Sentry from "@sentry/nextjs";
import { SENTRY_BASE_OPTIONS } from "@/shared/config/sentry";

Sentry.init(SENTRY_BASE_OPTIONS);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
