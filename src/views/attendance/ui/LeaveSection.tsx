"use client";

import { type ReactNode } from "react";
import { AttendanceChip, type LeaveRequest } from "@/entities/attendance";
import { useCancelLeave } from "@/features/attendance/cancel-leave";
import { formatDayLabel } from "@/shared/lib/calendar";

interface LeaveSectionProps {
  leaves: LeaveRequest[];
  isLoading: boolean;
  /** 휴가 신청 버튼 */
  action?: ReactNode;
}

const STATUS_TEXT: Record<LeaveRequest["status"], string> = {
  PENDING: "승인 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
};

/** 내 휴가 신청 목록 (최근 날짜부터). 대기 중이면 취소할 수 있다 */
const LeaveSection = ({ leaves, isLoading, action }: LeaveSectionProps) => {
  const { mutate: cancel, isPending, variables } = useCancelLeave();

  return (
    <section aria-labelledby="leave-title" className="rounded-[20px] bg-background-primary p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="leave-title" className="text-2lg-semibold text-text-primary">
          휴가
        </h2>
        {action}
      </div>

      {isLoading ? (
        <div aria-busy="true" className="h-[120px] rounded-[14px] bg-background-secondary animate-pulse" />
      ) : leaves.length === 0 ? (
        <p className="rounded-[14px] bg-background-secondary px-4 py-6 text-center text-md-regular text-text-default">
          아직 신청한 휴가가 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto">
          {leaves.map((leave) => (
            <li
              key={leave.id}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-background-secondary px-3.5 py-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-lg-semibold text-text-primary">{formatDayLabel(leave.date)}</span>
                <span className="text-sm-medium text-text-default truncate">{leave.reason ?? "사유 없음"}</span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <AttendanceChip
                  kind={leave.status === "PENDING" ? "PENDING" : leave.status === "APPROVED" ? "LEAVE" : "ABSENT"}
                  label={STATUS_TEXT[leave.status]}
                  className={leave.status === "REJECTED" ? "bg-text-default/15 text-text-default" : undefined}
                />
                {leave.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => cancel(leave.id)}
                    disabled={isPending && variables === leave.id}
                    className="min-h-6 text-xs-regular text-text-default underline disabled:opacity-50"
                  >
                    신청 취소
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs-regular text-text-disabled">팀장 또는 인사담당자가 승인하면 달력에 휴가로 표시돼요.</p>
    </section>
  );
};

export default LeaveSection;
