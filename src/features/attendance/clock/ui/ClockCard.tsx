"use client";

import {
  STATUS_LABEL,
  describePolicy,
  evaluateToday,
  formatClockTime,
  formatDuration,
  getClockState,
  nowKstNaiveIso,
  toEnginePolicy,
  useTodayAttendance,
  workedMinutes,
} from "@/entities/attendance";
import { cn } from "@/shared/lib/cn";
import { formatDayLabel } from "@/shared/lib/calendar";
import useNow from "@/shared/lib/useNow";
import { BaseButton } from "@/shared/ui/button";
import useClock from "../api/useClock";

interface ClockCardProps {
  /** sidebar: 사이드바 맨 위 카드 / panel: 내 근태 페이지의 "오늘" 카드 */
  variant?: "sidebar" | "panel";
  className?: string;
}

/**
 * 출퇴근 카드 (출근 전 / 근무 중 / 퇴근 완료). 접속 상태와는 별개다 (roadmap §0).
 * 판정 문구는 정책 엔진으로 계산한다.
 */
const ClockCard = ({ variant = "sidebar", className }: ClockCardProps) => {
  const { data, record, isPending: isLoading, isError } = useTodayAttendance();
  const { clockIn, clockOut, isPending } = useClock();
  const now = useNow();

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className={cn(
          "rounded-2xl bg-background-secondary animate-pulse",
          variant === "sidebar" ? "h-[132px]" : "h-[220px]",
          className,
        )}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className={cn("rounded-2xl bg-background-secondary p-4 text-sm-medium text-text-default", className)}>
        오늘 근태를 불러오지 못했어요.
      </p>
    );
  }

  const state = getClockState(record);
  const policy = toEnginePolicy(data.policy);
  const status = evaluateToday(record, policy, data.today);
  const minutes = record ? workedMinutes(record.clockInAt!, record.clockOutAt, nowKstNaiveIso(now)) : 0;
  const { typeLabel, rule } = describePolicy(policy);

  const actionButton =
    state === "BEFORE" ? (
      <BaseButton variant="solid" size="large" onClick={() => clockIn()} disabled={isPending}>
        출근하기
      </BaseButton>
    ) : state === "WORKING" ? (
      <BaseButton variant="outlinedPrimary" size="large" onClick={() => clockOut()} disabled={isPending}>
        퇴근하기
      </BaseButton>
    ) : (
      <p className="text-sm-medium text-icon-brand">오늘 근무를 마쳤어요</p>
    );

  if (variant === "panel") {
    return (
      <section
        aria-labelledby="today-title"
        className={cn("rounded-[20px] bg-background-primary p-6 flex flex-col gap-4", className)}
      >
        <div className="flex items-baseline justify-between">
          <h2 id="today-title" className="text-2lg-semibold text-text-primary">
            오늘
          </h2>
          <span className="text-xs-regular text-text-default">{formatDayLabel(data.today)}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {[
            { label: "출근", value: record?.clockInAt },
            { label: "퇴근", value: record?.clockOutAt },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[14px] bg-background-secondary p-3.5">
              <dt className="text-sm-medium text-text-default">{label}</dt>
              <dd className={cn("mt-1 text-2xl-bold", value ? "text-text-primary" : "text-text-disabled")}>
                {formatClockTime(value)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-md-regular text-text-secondary">
          {status ? (
            <>
              {state === "DONE"
                ? `${formatDuration(minutes)} 근무했어요. `
                : minutes < 1
                  ? "방금 출근했어요. "
                  : `${formatDuration(minutes)}째 근무 중이에요. `}
              오늘은{" "}
              <strong className={status === "LATE" ? "text-point-orange" : "text-icon-brand"}>
                {STATUS_LABEL[status]}
              </strong>
              으로 기록돼요.
            </>
          ) : (
            <>아직 출근 전이에요. {rule}이에요.</>
          )}
        </p>
        {actionButton}
      </section>
    );
  }

  return (
    <section
      aria-label="오늘 출퇴근"
      className={cn(
        "rounded-2xl border border-border-primary bg-background-secondary p-4 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm-semibold text-text-secondary">오늘 · {formatDayLabel(data.today)}</span>
        <span className="text-xs-regular text-text-default truncate">{typeLabel}</span>
      </div>
      {state === "BEFORE" ? (
        <p className="text-md-regular text-text-default">아직 출근 전이에요</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl-bold text-text-primary">{formatDuration(minutes)}</span>
          <span className="text-sm-medium text-text-default">
            {formatClockTime(record?.clockInAt)} 출근
            {state === "DONE"
              ? ` · ${formatClockTime(record?.clockOutAt)} 퇴근`
              : status && ` · ${STATUS_LABEL[status]}`}
          </span>
        </div>
      )}
      {actionButton}
    </section>
  );
};

export default ClockCard;
