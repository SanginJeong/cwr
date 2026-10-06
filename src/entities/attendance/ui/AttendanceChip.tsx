import { cn } from "@/shared/lib/cn";
import type { AttendanceStatus } from "../lib/policy-engine";
import { STATUS_LABEL } from "../lib/describe";

/** 판정 상태 + 휴가 승인 대기(판정과 별개로 leave_requests에서 온다) */
export type ChipKind = AttendanceStatus | "PENDING";

export const CHIP_STYLE: Record<ChipKind, string> = {
  ON_TIME: "bg-brand-primary/20 text-icon-brand",
  LATE: "bg-point-orange/20 text-point-orange",
  ABSENT: "bg-status-danger/20 text-status-danger",
  LEAVE: "bg-point-purple/20 text-point-purple",
  PENDING: "border border-dashed border-point-yellow text-point-yellow",
};

/** 범례·칩의 점 색 */
export const CHIP_DOT: Record<ChipKind, string> = {
  ON_TIME: "bg-brand-primary",
  LATE: "bg-point-orange",
  ABSENT: "bg-status-danger",
  LEAVE: "bg-point-purple",
  PENDING: "border border-dashed border-point-yellow",
};

export const CHIP_LABEL: Record<ChipKind, string> = { ...STATUS_LABEL, PENDING: "승인 대기" };

const AttendanceChip = ({ kind, label, className }: { kind: ChipKind; label?: string; className?: string }) => (
  <span
    className={cn(
      "self-start max-w-full truncate rounded-lg px-1.5 tablet:px-2 py-0.5 text-xs-semibold",
      CHIP_STYLE[kind],
      className,
    )}
  >
    {label ?? CHIP_LABEL[kind]}
  </span>
);

export default AttendanceChip;
