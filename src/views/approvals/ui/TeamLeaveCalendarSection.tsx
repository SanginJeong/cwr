"use client";

import { useState } from "react";
import { useTeamLeaveCalendar, type TeamLeaveCalendar } from "@/entities/attendance";
import type { TeamSummary } from "@/shared/api/types/groupApi";
import { cn } from "@/shared/lib/cn";
import { formatMonthLabel, monthRange, shiftMonth, toMonthKey } from "@/shared/lib/calendar";
import { toKstDateString } from "@/shared/lib/kstDate";
import { Icon } from "@/shared/ui/icon";
import { MonthCalendar } from "@/shared/ui/month-calendar";

type Leave = TeamLeaveCalendar["leaves"][number];

/**
 * 이번 달 팀 휴가 (평일만). 이름 칩: 승인됨 보라, 대기 노란 점선.
 * 같은 날 2명 이상이면 주황 테두리와 "겹침 N명" (와이어프레임 "팀장 · 휴가 승인")
 */
const TeamLeaveCalendarSection = ({ teams }: { teams: TeamSummary[] }) => {
  const [teamId, setTeamId] = useState(teams[0]?.id);
  const [month, setMonth] = useState(() => toMonthKey(toKstDateString(new Date())));
  const { from, to } = monthRange(month);
  const selectedTeamId = teams.some((t) => t.id === teamId) ? teamId : teams[0]?.id;

  const { data, isPending, isError } = useTeamLeaveCalendar(
    { groupId: selectedTeamId ?? 0, from, to },
    selectedTeamId !== undefined,
  );

  if (teams.length === 0) return null;

  const byDate = new Map<string, Leave[]>();
  for (const leave of data?.leaves ?? []) {
    byDate.set(leave.date, [...(byDate.get(leave.date) ?? []), leave]);
  }

  return (
    <section
      aria-labelledby="team-cal-title"
      className="rounded-[20px] bg-background-primary p-4 tablet:p-6 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="team-cal-title" className="text-2lg-semibold text-text-primary">
          팀 휴가 <span className="text-md-regular text-text-default">{formatMonthLabel(month)} · 평일만</span>
        </h2>
        <div className="flex items-center gap-2">
          {teams.length > 1 && (
            <select
              aria-label="팀 선택"
              value={selectedTeamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
              className="h-9 rounded-[10px] border border-border-primary bg-background-secondary px-3 text-md-medium text-text-primary"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="size-9 rounded-[10px] border border-border-primary flex-center text-text-secondary hover:bg-background-tertiary"
          >
            <Icon name="leftArrow" className="size-3 tablet:size-3" />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="size-9 rounded-[10px] border border-border-primary flex-center text-text-secondary hover:bg-background-tertiary"
          >
            <Icon name="rightArrow" className="size-3 tablet:size-3" />
          </button>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs-regular text-text-default">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded bg-point-purple/25" />
          승인된 휴가
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded border border-dashed border-point-yellow" />
          승인 대기
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded border-2 border-point-orange" />
          2명 이상 겹침
        </li>
      </ul>

      {isError ? (
        <p className="py-8 text-center text-text-default">팀 휴가를 불러오지 못했어요.</p>
      ) : isPending ? (
        <div aria-busy="true" className="h-[420px] rounded-[14px] bg-background-secondary animate-pulse" />
      ) : (
        <MonthCalendar
          month={month}
          today={data.today}
          weekdaysOnly
          getDayState={(day) => ({ highlighted: (byDate.get(day.date)?.length ?? 0) >= 2 })}
          renderDay={(day) => {
            const leaves = byDate.get(day.date) ?? [];
            return (
              <>
                {leaves.length >= 2 && (
                  <span className="text-xs-semibold text-point-orange">겹침 {leaves.length}명</span>
                )}
                {leaves.map((leave) => (
                  <span
                    key={leave.id}
                    className={cn(
                      "self-start max-w-full truncate rounded-lg px-1.5 tablet:px-2 py-0.5 text-xs-semibold",
                      leave.status === "APPROVED"
                        ? "bg-point-purple/25 text-point-purple"
                        : "border border-dashed border-point-yellow text-point-yellow",
                    )}
                  >
                    {leave.userName}
                    {leave.status === "PENDING" && " · 대기"}
                  </span>
                ))}
              </>
            );
          }}
        />
      )}
    </section>
  );
};

export default TeamLeaveCalendarSection;
