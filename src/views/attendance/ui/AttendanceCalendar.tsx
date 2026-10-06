"use client";

import {
  AttendanceChip,
  CHIP_DOT,
  CHIP_LABEL,
  formatClockTime,
  type ChipKind,
  type DailyEvaluation,
  type DayRecord,
  type LeaveRequest,
} from "@/entities/attendance";
import { cn } from "@/shared/lib/cn";
import { MonthCalendar } from "@/shared/ui/month-calendar";

interface AttendanceCalendarProps {
  month: string;
  today: string;
  evaluations: DailyEvaluation[];
  records: DayRecord[];
  leaves: LeaveRequest[];
}

const LEGEND: ChipKind[] = ["ON_TIME", "LATE", "ABSENT", "LEAVE", "PENDING"];

/** 날짜 칸: 판정 칩 + 출퇴근 시각. 승인 대기 휴가는 판정과 별개로 점선 칩 */
const AttendanceCalendar = ({ month, today, evaluations, records, leaves }: AttendanceCalendarProps) => {
  const statusByDate = new Map(evaluations.map((e) => [e.date, e.status]));
  const workByDate = new Map(records.filter((r) => r.kind === "WORK").map((r) => [r.date, r]));
  const leaveByDate = new Map(leaves.filter((l) => l.status !== "REJECTED").map((l) => [l.date, l]));

  return (
    <section aria-label="월 달력" className="rounded-[20px] bg-background-primary p-3 tablet:p-6">
      <MonthCalendar
        month={month}
        today={today}
        renderDay={(day) => {
          const status = statusByDate.get(day.date);
          const work = workByDate.get(day.date);
          const leave = leaveByDate.get(day.date);
          const kind: ChipKind | null = status ?? (leave?.status === "PENDING" ? "PENDING" : null);

          return (
            <>
              {kind && <AttendanceChip kind={kind} />}
              {work && !day.isWeekend && (
                <span className="hidden tablet:block text-xs-regular text-text-default truncate">
                  {formatClockTime(work.clockInAt)} – {work.clockOutAt ? formatClockTime(work.clockOutAt) : "근무 중"}
                </span>
              )}
              {leave?.reason && (status === "LEAVE" || kind === "PENDING") && (
                <span className="hidden tablet:block text-xs-regular text-text-default truncate">{leave.reason}</span>
              )}
            </>
          );
        }}
      />
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm-medium text-text-default">
        {LEGEND.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-[3px]", CHIP_DOT[kind])} />
            {kind === "PENDING" ? "휴가 승인 대기" : CHIP_LABEL[kind]}
          </li>
        ))}
        <li className="tablet:ml-auto text-text-disabled">주말은 판정하지 않아요</li>
      </ul>
    </section>
  );
};

export default AttendanceCalendar;
