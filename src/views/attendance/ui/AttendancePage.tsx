"use client";

import { useState } from "react";
import {
  describePolicy,
  evaluateAttendance,
  summarizeAttendance,
  toEnginePolicy,
  useAttendanceRange,
  useLeaveRequests,
} from "@/entities/attendance";
import { useGetUser } from "@/entities/user";
import { ClockCard } from "@/features/attendance/clock";
import { RequestLeaveModal } from "@/features/attendance/request-leave";
import { formatMonthLabel, monthRange, shiftMonth, toMonthKey } from "@/shared/lib/calendar";
import { toKstDateString } from "@/shared/lib/kstDate";
import { Icon } from "@/shared/ui/icon";
import { PageLayout } from "@/shared/ui/page-layout";
import AttendanceCalendar from "./AttendanceCalendar";
import AttendanceSummary from "./AttendanceSummary";
import LeaveSection from "./LeaveSection";

/**
 * 내 근태 (/attendance). 로그인 후 첫 화면이다 (roadmap H3).
 * 판정은 저장하지 않고 attendance_range 응답을 정책 엔진에 넣어 매번 계산한다 (ADR-007)
 */
const AttendancePage = () => {
  const [month, setMonth] = useState(() => toMonthKey(toKstDateString(new Date())));
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const { from, to } = monthRange(month);

  const { data: me } = useGetUser();
  const { data: range, isPending, isError, refetch } = useAttendanceRange({ from, to });
  // 달력의 "승인 대기" 칩과 휴가 목록 (RLS로 팀원 것도 보일 수 있어 본인 것만 거른다)
  const { data: leaves = [], isPending: isLeavesLoading } = useLeaveRequests({ userId: me?.id }, !!me);

  const today = range?.today ?? toKstDateString(new Date());
  const evaluations = range ? evaluateAttendance(range, from, to, today) : [];
  const policy = range ? describePolicy(toEnginePolicy(range.policy)) : null;
  const sortedLeaves = [...leaves].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <PageLayout ariaLabel="내 근태">
      <div className="w-full max-w-[1180px] flex flex-col gap-5 tablet:gap-7 pb-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl-bold tablet:text-[28px] text-text-primary">내 근태</h1>
            {policy && range && (
              <p className="text-md-regular text-text-default">
                근태 정책: <strong className="font-semibold text-text-secondary">{range.policy.name}</strong>
                {/* 정책 이름이 유형 이름과 같으면("자율 출퇴근") 한 번만 */}
                {range.policy.name !== policy.typeLabel && ` · ${policy.typeLabel}`}
                {policy.hours && ` · ${policy.hours}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="size-11 rounded-xl border border-border-primary bg-background-primary flex-center text-text-secondary hover:bg-background-tertiary"
            >
              <Icon name="leftArrow" className="size-4 tablet:size-4" />
            </button>
            <span aria-live="polite" className="min-w-[128px] text-center text-2lg-semibold text-text-primary">
              {formatMonthLabel(month)}
            </span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="size-11 rounded-xl border border-border-primary bg-background-primary flex-center text-text-secondary hover:bg-background-tertiary"
            >
              <Icon name="rightArrow" className="size-4 tablet:size-4" />
            </button>
          </div>
        </header>

        {isError ? (
          <div className="rounded-[20px] bg-background-primary p-8 flex-col-center gap-4 text-text-default">
            근태 기록을 불러오지 못했어요.
            <button type="button" onClick={() => refetch()} className="text-icon-brand underline">
              다시 시도하기
            </button>
          </div>
        ) : (
          <>
            {isPending ? (
              <div aria-busy="true" className="h-[96px] rounded-[20px] bg-background-primary animate-pulse" />
            ) : (
              <AttendanceSummary summary={summarizeAttendance(evaluations)} />
            )}

            <div className="flex flex-col pc:flex-row gap-6 items-stretch pc:items-start">
              <div className="flex-1 min-w-0">
                {isPending || !range ? (
                  <div aria-busy="true" className="h-[560px] rounded-[20px] bg-background-primary animate-pulse" />
                ) : (
                  <AttendanceCalendar
                    month={month}
                    today={today}
                    evaluations={evaluations}
                    records={range.records}
                    leaves={leaves}
                  />
                )}
              </div>
              <aside className="w-full pc:w-[340px] shrink-0 flex flex-col gap-4">
                <ClockCard />
                <LeaveSection
                  leaves={sortedLeaves}
                  isLoading={isLeavesLoading}
                  action={
                    <button
                      type="button"
                      onClick={() => setIsLeaveModalOpen(true)}
                      className="h-9 px-3.5 rounded-[10px] bg-brand-primary text-md-semibold text-text-inverse hover:bg-interaction-hover"
                    >
                      휴가 신청
                    </button>
                  }
                />
              </aside>
            </div>
          </>
        )}
      </div>

      <RequestLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        today={today}
        leaves={leaves}
      />
    </PageLayout>
  );
};

export default AttendancePage;
