import { CHIP_DOT, CHIP_LABEL, type AttendanceStatus, type AttendanceSummary as Summary } from "@/entities/attendance";
import { cn } from "@/shared/lib/cn";

const ORDER: AttendanceStatus[] = ["ON_TIME", "LATE", "ABSENT", "LEAVE"];
const VALUE_COLOR: Record<AttendanceStatus, string> = {
  ON_TIME: "text-icon-brand",
  LATE: "text-point-orange",
  ABSENT: "text-status-danger",
  LEAVE: "text-point-purple",
};

/** 이번 달 상태별 일수. 판정 대상(평일, 지난 날·출근한 오늘)만 센다 */
const AttendanceSummary = ({ summary }: { summary: Summary }) => (
  <section aria-label="이번 달 요약" className="grid grid-cols-2 tablet:grid-cols-4 gap-3 tablet:gap-4">
    {ORDER.map((status) => (
      <div
        key={status}
        className="rounded-[20px] bg-background-primary px-5 py-4 tablet:px-6 tablet:py-5 flex flex-col gap-1.5"
      >
        <span className="flex items-center gap-2 text-md-medium text-text-default">
          <span aria-hidden="true" className={cn("size-2.5 rounded-full", CHIP_DOT[status])} />
          {CHIP_LABEL[status]}
        </span>
        <span className={cn("text-3xl-bold", summary[status] > 0 ? VALUE_COLOR[status] : "text-text-primary")}>
          {summary[status]}
          <span className="text-lg-medium text-text-default"> 일</span>
        </span>
      </div>
    ))}
  </section>
);

export default AttendanceSummary;
