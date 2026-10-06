"use client";

import { summarizeTeamToday, type MemberToday, type TeamTodayKind } from "@/entities/attendance";
import { cn } from "@/shared/lib/cn";
import { formatDayLabel } from "@/shared/lib/calendar";

export const TEAM_TODAY_LABEL: Record<TeamTodayKind, string> = {
  ON_TIME: "정상",
  LATE: "지각",
  LEAVE: "휴가",
  NOT_YET: "미출근",
};

export const TEAM_TODAY_STYLE: Record<TeamTodayKind, { value: string; chip: string }> = {
  ON_TIME: { value: "text-icon-brand", chip: "bg-brand-primary/20 text-icon-brand" },
  LATE: { value: "text-point-orange", chip: "bg-point-orange/20 text-point-orange" },
  LEAVE: { value: "text-point-purple", chip: "bg-point-purple/20 text-point-purple" },
  NOT_YET: { value: "text-text-secondary", chip: "bg-text-default/15 text-text-default" },
};

const ORDER: TeamTodayKind[] = ["ON_TIME", "LATE", "LEAVE", "NOT_YET"];

interface TeamTodayCardProps {
  today: string;
  members: MemberToday[];
  isLoading: boolean;
}

/** 오늘 우리 팀 근태 (팀장·인사담당자만 보인다). 판정은 정책 엔진 */
const TeamTodayCard = ({ today, members, isLoading }: TeamTodayCardProps) => {
  const summary = summarizeTeamToday(members);
  const isOffDay = !isLoading && members.every((m) => m.kind === null);

  return (
    <section
      aria-labelledby="team-today-title"
      className="rounded-[20px] bg-background-primary px-5 py-4 flex flex-col gap-3"
    >
      <header className="flex items-baseline justify-between">
        <h2 id="team-today-title" className="text-lg-medium text-text-primary">
          오늘 우리 팀 근태
        </h2>
        <span className="text-xs-regular text-text-default">{formatDayLabel(today)}</span>
      </header>
      {isLoading ? (
        <div aria-busy="true" className="h-[60px] rounded-xl bg-background-secondary animate-pulse" />
      ) : isOffDay ? (
        <p className="rounded-xl bg-background-secondary py-4 text-center text-sm-medium text-text-default">
          오늘은 판정하지 않는 날이에요 (주말)
        </p>
      ) : (
        <dl className="grid grid-cols-4 gap-2">
          {ORDER.map((kind) => (
            <div
              key={kind}
              className="rounded-xl bg-background-secondary px-2 py-2.5 flex flex-col-reverse items-center gap-0.5"
            >
              <dt className="text-xs-regular text-text-default">{TEAM_TODAY_LABEL[kind]}</dt>
              <dd
                className={cn("text-xl-bold", summary[kind] > 0 ? TEAM_TODAY_STYLE[kind].value : "text-text-disabled")}
              >
                {summary[kind]}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

export default TeamTodayCard;
