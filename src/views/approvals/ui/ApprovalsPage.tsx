"use client";

import { useState } from "react";
import { useReviewLeaveRequests } from "@/entities/attendance";
import { useGetVisibleTeams } from "@/entities/team";
import { useGetUser } from "@/entities/user";
import { cn } from "@/shared/lib/cn";
import { PageLayout } from "@/shared/ui/page-layout";
import LeaveReviewList from "./LeaveReviewList";
import TeamLeaveCalendarSection from "./TeamLeaveCalendarSection";

/**
 * 휴가 승인 (/approvals). 팀장은 자기 팀원, 인사담당자는 회사 전체 (review_leave_requests).
 * 같은 신청을 팀장과 인사담당자가 모두 처리할 수 있고, 먼저 처리한 결정이 적용된다 (ADR-007)
 */
const ApprovalsPage = () => {
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const { data: me } = useGetUser();
  const isHrAdmin = me?.companyRole === "HR_ADMIN";

  const pendingQuery = useReviewLeaveRequests(true);
  const doneQuery = useReviewLeaveRequests(false, tab === "done");
  const current = tab === "pending" ? pendingQuery : doneQuery;

  // 달력의 팀: 인사담당자는 회사의 모든 팀, 팀장은 내가 팀장인 팀
  const { data: allTeams = [] } = useGetVisibleTeams({ enabled: isHrAdmin });
  const leaderTeams =
    me?.memberships.filter((m) => m.role === "ADMIN").map((m) => ({ id: m.groupId, name: m.group.name })) ?? [];
  const calendarTeams = isHrAdmin ? allTeams : leaderTeams;

  const description = isHrAdmin
    ? "회사 전체의 휴가 신청이에요. 팀장도 같은 신청을 처리할 수 있고, 먼저 처리한 결정이 적용돼요."
    : `${leaderTeams.map((t) => t.name).join(", ")} 팀원의 휴가 신청이에요. 인사담당자도 같은 신청을 처리할 수 있고, 먼저 처리한 결정이 적용돼요.`;

  const tabs = [
    { key: "pending" as const, label: `대기 ${pendingQuery.data?.length ?? ""}`.trim() },
    { key: "done" as const, label: "처리됨" },
  ];

  return (
    <PageLayout ariaLabel="휴가 승인">
      <div className="w-full max-w-[1180px] flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl-bold tablet:text-[28px] text-text-primary">휴가 승인</h1>
          {me && <p className="text-md-regular text-text-default">{description}</p>}
        </header>

        <div role="tablist" aria-label="신청 상태" className="flex gap-2">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "h-10 px-4 rounded-full text-md-semibold",
                tab === key
                  ? "bg-brand-primary text-text-inverse"
                  : "border border-border-primary bg-background-primary text-text-secondary hover:bg-background-tertiary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {current.isError ? (
          <p className="rounded-[20px] bg-background-primary px-6 py-12 text-center text-text-default">
            휴가 신청을 불러오지 못했어요.
          </p>
        ) : (
          <LeaveReviewList requests={current.data ?? []} pending={tab === "pending"} isLoading={current.isPending} />
        )}

        <TeamLeaveCalendarSection teams={calendarTeams} />
      </div>
    </PageLayout>
  );
};

export default ApprovalsPage;
