"use client";

import Link from "next/link";
import {
  formatDuration,
  getClockState,
  nowKstNaiveIso,
  useTodayAttendance,
  workedMinutes,
} from "@/entities/attendance";
import { cn } from "@/shared/lib/cn";
import useNow from "@/shared/lib/useNow";
import { ROUTES } from "@/shared/config/routes";

/**
 * 모바일 헤더의 출퇴근 상태. 누르면 내 근태로 간다.
 * 헤더에서 바로 출퇴근하면 잘못 누르기 쉬워서, 버튼은 서랍의 카드와 내 근태 페이지에만 둔다.
 */
const ClockStatusPill = ({ className }: { className?: string }) => {
  const { record, isPending } = useTodayAttendance();
  const now = useNow();
  if (isPending) return null;

  const state = getClockState(record);
  const label =
    state === "BEFORE"
      ? "출근 전"
      : state === "WORKING"
        ? `근무 중 · ${formatDuration(workedMinutes(record!.clockInAt!, null, nowKstNaiveIso(now)))}`
        : "퇴근 완료";

  return (
    <Link
      href={ROUTES.attendance}
      aria-label={`내 근태: ${label}`}
      className={cn(
        "h-8 px-3 rounded-full flex items-center gap-1.5 text-xs-semibold border",
        state === "WORKING"
          ? "border-brand-primary text-icon-brand"
          : state === "BEFORE"
            ? "border-border-secondary text-text-secondary"
            : "border-border-primary text-text-default",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          state === "WORKING" ? "bg-brand-primary" : state === "BEFORE" ? "bg-text-default" : "bg-text-disabled",
        )}
      />
      {label}
    </Link>
  );
};

export default ClockStatusPill;
