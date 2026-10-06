import { cn } from "@/shared/lib/cn";
import { PRESENCE_DOT_CLASS, PRESENCE_LABEL, PresenceStatus } from "@/shared/config/presence";

const DOT_SIZE = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
} as const;

interface StatusDotProps {
  status: PresenceStatus;
  size?: keyof typeof DOT_SIZE;
  className?: string;
}

/** 접속 상태 점. 테두리를 배경색으로 둘러서 프로필 사진 위에 겹쳐도 구분되게 한다 */
const StatusDot = ({ status, size = "md", className }: StatusDotProps) => (
  <span
    role="img"
    aria-label={PRESENCE_LABEL[status]}
    title={PRESENCE_LABEL[status]}
    className={cn(
      "inline-block rounded-full border-2 border-background-primary",
      DOT_SIZE[size],
      PRESENCE_DOT_CLASS[status],
      className,
    )}
  />
);

export default StatusDot;
