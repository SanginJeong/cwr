import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { buildMonthGrid, weekdayHeaders, type CalendarDay } from "@/shared/lib/calendar";

/**
 * 공통 월 달력. 날짜 칸 안에 칩 등을 넣는 구조다 (roadmap H3).
 *
 * - regular: 내 근태·팀 휴가 달력. renderDay로 칸 안의 내용을 그린다
 * - compact: 날짜 고르기. onSelectDay를 주면 칸이 버튼이 된다
 * - weekdaysOnly: 주말 칸을 뺀다 (팀장 휴가 달력)
 *
 * @example
 * ```tsx
 * <MonthCalendar
 *   month="2026-10"
 *   today="2026-10-06"
 *   renderDay={(day) => <StatusChip status={statusByDate[day.date]} />}
 *   getDayState={(day) => ({ highlighted: overlaps[day.date] > 1 })}
 * />
 * ```
 */

export interface DayState {
  /** 칸 테두리 강조 (예: 휴가 겹침) */
  highlighted?: boolean;
  /** compact에서 선택된 날 */
  selected?: boolean;
  /** compact에서 고를 수 없는 날 */
  disabled?: boolean;
  className?: string;
}

interface MonthCalendarProps {
  /** "YYYY-MM" */
  month: string;
  /** "YYYY-MM-DD". 오늘 칸 표시 기준 */
  today: string;
  weekdaysOnly?: boolean;
  size?: "regular" | "compact";
  renderDay?: (day: CalendarDay) => ReactNode;
  getDayState?: (day: CalendarDay) => DayState;
  onSelectDay?: (day: CalendarDay) => void;
  className?: string;
}

const MonthCalendar = ({
  month,
  today,
  weekdaysOnly = false,
  size = "regular",
  renderDay,
  getDayState,
  onSelectDay,
  className,
}: MonthCalendarProps) => {
  const cells = buildMonthGrid(month, today, { weekdaysOnly });
  const isCompact = size === "compact";
  const columns = weekdaysOnly ? "grid-cols-5" : "grid-cols-7";

  const dayNumberColor = (day: CalendarDay) =>
    day.dayOfWeek === 0 ? "text-status-danger" : day.isWeekend ? "text-text-disabled" : "text-text-secondary";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("grid gap-1 mb-2 tablet:gap-2", columns)} aria-hidden="true">
        {weekdayHeaders(weekdaysOnly).map(({ dayOfWeek, label }) => (
          <span
            key={dayOfWeek}
            className={cn("text-center text-xs-medium", dayOfWeek === 0 ? "text-status-danger" : "text-text-default")}
          >
            {label}
          </span>
        ))}
      </div>

      <ol className={cn("grid", columns, isCompact ? "gap-1" : "gap-1 tablet:gap-2")}>
        {cells.map((day, index) => {
          if (!day) return <li key={`blank-${index}`} aria-hidden="true" />;

          const state = getDayState?.(day) ?? {};

          if (isCompact) {
            return (
              <li key={day.date}>
                <button
                  type="button"
                  disabled={state.disabled || !onSelectDay}
                  aria-pressed={state.selected}
                  aria-label={day.date}
                  onClick={() => onSelectDay?.(day)}
                  className={cn(
                    "w-full h-9 rounded-[10px] flex-center text-sm-medium",
                    state.selected
                      ? "bg-brand-primary text-text-inverse"
                      : state.disabled
                        ? "text-text-disabled cursor-not-allowed"
                        : cn(dayNumberColor(day), "hover:bg-background-tertiary"),
                    day.isToday && !state.selected && "ring-1 ring-brand-primary",
                    state.className,
                  )}
                >
                  {day.day}
                </button>
              </li>
            );
          }

          return (
            <li
              key={day.date}
              aria-current={day.isToday ? "date" : undefined}
              className={cn(
                "min-h-[64px] tablet:min-h-[92px] rounded-[14px] p-1.5 tablet:p-2.5 flex flex-col gap-1 tablet:gap-2 min-w-0",
                day.isWeekend ? "bg-transparent" : "bg-background-secondary",
                day.isToday && "ring-2 ring-inset ring-brand-primary",
                state.highlighted && !day.isToday && "ring-2 ring-inset ring-point-orange",
                state.className,
              )}
            >
              <span className={cn("text-sm-medium", day.isToday && "font-bold", dayNumberColor(day))}>{day.day}</span>
              {renderDay?.(day)}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default MonthCalendar;
