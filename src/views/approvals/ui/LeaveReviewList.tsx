"use client";

import { AttendanceChip, type ReviewLeaveRequest } from "@/entities/attendance";
import { useDecideLeave } from "@/features/attendance/decide-leave";
import { cn } from "@/shared/lib/cn";
import { formatDayLabel } from "@/shared/lib/calendar";

interface LeaveReviewListProps {
  requests: ReviewLeaveRequest[];
  pending: boolean;
  isLoading: boolean;
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return "";
  // KST 기준 "10월 6일 15:20"
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString();
  return `${formatDayLabel(kst.slice(0, 10)).replace(/ \(.\)$/, "")} ${kst.slice(11, 16)}`;
};

/** 같은 날 겹침: 신청자와 같은 팀의 다른 사람이 같은 날 대기·승인 휴가가 있으면 주황색 */
const OverlapText = ({ overlaps }: Pick<ReviewLeaveRequest, "overlaps">) =>
  overlaps.length === 0 ? (
    <span className="text-text-default">겹치는 휴가 없음</span>
  ) : (
    <span className="text-point-orange">
      {overlaps.map((o) => `${o.userName}${o.status === "PENDING" ? "(대기)" : ""}`).join(", ")}와 겹침
    </span>
  );

const LeaveReviewList = ({ requests, pending, isLoading }: LeaveReviewListProps) => {
  const { mutate: decide, isPending, variables } = useDecideLeave();

  if (isLoading) {
    return <div aria-busy="true" className="h-[240px] rounded-[20px] bg-background-primary animate-pulse" />;
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-[20px] bg-background-primary px-6 py-12 text-center text-md-regular text-text-default">
        {pending ? "승인을 기다리는 휴가 신청이 없어요." : "처리한 휴가 신청이 없어요."}
      </p>
    );
  }

  return (
    <section
      aria-label={pending ? "승인 대기 목록" : "처리된 목록"}
      className="rounded-[20px] bg-background-primary overflow-x-auto"
    >
      <table className="w-full min-w-[760px] border-collapse text-md-regular">
        <thead>
          <tr className="text-left text-sm-medium text-text-default">
            <th className="px-6 py-4 font-medium">신청자</th>
            <th className="px-3 py-4 font-medium">휴가 날짜</th>
            <th className="px-3 py-4 font-medium">사유</th>
            <th className="px-3 py-4 font-medium">{pending ? "그날 팀 상황" : "결과"}</th>
            {pending && <th className="px-6 py-4 font-medium text-right">처리</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const isDeciding = isPending && variables?.requestId === request.id;
            return (
              <tr key={request.id} className="border-t border-border-primary align-middle">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-9 shrink-0 rounded-[10px] bg-background-tertiary flex-center text-md-semibold text-text-secondary"
                    >
                      {request.userName.slice(0, 1)}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-md-semibold text-text-primary">{request.userName}</span>
                      <span className="text-xs-regular text-text-default truncate">
                        {request.teams.join(", ") || "소속 팀 없음"} · {formatDateTime(request.createdAt)} 신청
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-md-semibold text-text-primary whitespace-nowrap">
                  {formatDayLabel(request.date)}
                </td>
                <td className="px-3 py-4 text-text-secondary">{request.reason ?? "—"}</td>
                <td className="px-3 py-4">
                  {pending ? (
                    <OverlapText overlaps={request.overlaps} />
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <AttendanceChip
                        kind={request.status === "APPROVED" ? "LEAVE" : "ABSENT"}
                        label={request.status === "APPROVED" ? "승인됨" : "반려됨"}
                        className={cn(request.status === "REJECTED" && "bg-text-default/15 text-text-default")}
                      />
                      <span className="text-xs-regular text-text-default">
                        {request.decidedByName ?? "알 수 없음"} · {formatDateTime(request.decidedAt)}
                      </span>
                    </div>
                  )}
                </td>
                {pending && (
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={isDeciding}
                        onClick={() => decide({ requestId: request.id, approve: false })}
                        className="h-9 px-3.5 rounded-[10px] border border-border-secondary text-md-semibold text-text-secondary hover:bg-background-tertiary disabled:opacity-50"
                      >
                        반려
                      </button>
                      <button
                        type="button"
                        disabled={isDeciding}
                        onClick={() => decide({ requestId: request.id, approve: true })}
                        className="h-9 px-3.5 rounded-[10px] bg-brand-primary text-md-semibold text-text-inverse hover:bg-interaction-hover disabled:opacity-50"
                      >
                        승인
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default LeaveReviewList;
