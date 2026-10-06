import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import MonthCalendar from "./MonthCalendar";

const meta: Meta<typeof MonthCalendar> = {
  title: "Common/MonthCalendar",
  component: MonthCalendar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: { month: "2026-10", today: "2026-10-06" },
  decorators: [
    (Story) => (
      <div className="max-w-[760px] bg-background-primary rounded-[20px] p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const chip = (label: string, className: string) => (
  <span className={`self-start rounded-lg px-2 py-0.5 text-xs-semibold ${className}`}>{label}</span>
);

/** 내 근태: 칸 안에 상태 칩 */
export const WithChips: Story = {
  args: {
    renderDay: (day) =>
      ({
        "2026-10-01": chip("정상", "bg-brand-primary/20 text-icon-brand"),
        "2026-10-02": chip("휴가", "bg-point-purple/20 text-point-purple"),
        "2026-10-05": chip("지각", "bg-point-orange/20 text-point-orange"),
        "2026-10-23": chip("승인 대기", "border border-dashed border-point-yellow text-point-yellow"),
      })[day.date],
  },
};

/** 팀 휴가: 평일만, 겹친 날 강조 */
export const WeekdaysOnly: Story = {
  args: {
    weekdaysOnly: true,
    getDayState: (day) => ({ highlighted: day.date === "2026-10-15" }),
  },
};

/** 날짜 고르기: 오늘까지와 주말은 고를 수 없음 */
export const Compact: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<string | null>("2026-10-27");
    return (
      <MonthCalendar
        {...args}
        size="compact"
        getDayState={(day) => ({ disabled: day.date <= args.today || day.isWeekend, selected: day.date === selected })}
        onSelectDay={(day) => setSelected(day.date)}
      />
    );
  },
};
