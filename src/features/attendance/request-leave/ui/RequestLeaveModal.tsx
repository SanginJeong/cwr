"use client";

import { useState } from "react";
import type { LeaveRequest } from "@/entities/attendance";
import { formatDayLabel, formatMonthLabel, shiftMonth, toMonthKey } from "@/shared/lib/calendar";
import { BaseButton } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { MonthCalendar } from "@/shared/ui/month-calendar";
import useRequestLeave from "../api/useRequestLeave";

const REASON_MAX = 200;

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 서버 기준 오늘 "YYYY-MM-DD" */
  today: string;
  /** 이미 신청한 휴가. 대기·승인된 날짜는 고를 수 없다 */
  leaves: LeaveRequest[];
}

/** 하루 단위 휴가 신청. 내일부터, 평일만 고를 수 있다 (request_leave와 같은 규칙) */
const RequestLeaveModal = ({ isOpen, onClose, today, leaves }: RequestLeaveModalProps) => {
  const [month, setMonth] = useState(() => toMonthKey(today));
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { mutate: request, isPending } = useRequestLeave();

  const takenDates = new Set(leaves.filter((l) => l.status !== "REJECTED").map((l) => l.date));
  const minMonth = toMonthKey(today);

  const close = () => {
    setSelected(null);
    setReason("");
    setMonth(minMonth);
    onClose();
  };

  const submit = () => {
    if (!selected) return;
    request({ date: selected, reason: reason.trim() || undefined }, { onSuccess: close });
  };

  return (
    <Modal isOpen={isOpen} onClose={close} className="gap-5 pt-8 pb-6 px-6">
      <Modal.CloseIcon onClose={close} />
      <div className="flex-col-center gap-1.5 text-center">
        <h2 className="text-2lg-semibold text-text-primary">휴가 신청</h2>
        <p className="text-md-regular text-text-default">하루 단위로, 내일부터 평일만 신청할 수 있어요.</p>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        <span className="text-lg-medium text-text-primary">날짜</span>
        <div className="rounded-2xl bg-background-secondary p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              aria-label="이전 달"
              disabled={month <= minMonth}
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="size-8 rounded-lg bg-background-primary flex-center text-text-secondary disabled:opacity-40"
            >
              <Icon name="leftArrow" className="size-3 tablet:size-3" />
            </button>
            <span className="text-lg-semibold text-text-primary">{formatMonthLabel(month)}</span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="size-8 rounded-lg bg-background-primary flex-center text-text-secondary"
            >
              <Icon name="rightArrow" className="size-3 tablet:size-3" />
            </button>
          </div>
          <MonthCalendar
            month={month}
            today={today}
            size="compact"
            getDayState={(day) => ({
              disabled: day.date <= today || day.isWeekend || takenDates.has(day.date),
              selected: day.date === selected,
              className: takenDates.has(day.date) ? "border border-dashed border-point-yellow" : undefined,
            })}
            onSelectDay={(day) => setSelected(day.date)}
          />
        </div>
        <span aria-live="polite" className="text-sm-medium text-icon-brand min-h-4">
          {selected ? `${formatDayLabel(selected)} 선택됨` : ""}
        </span>
      </div>

      <Input
        label="사유 (선택)"
        placeholder="예: 가족 행사"
        value={reason}
        maxLength={REASON_MAX}
        onChange={(e) => setReason(e.target.value)}
      />

      <div className="w-full rounded-[14px] bg-background-secondary px-3.5 py-3 flex flex-col gap-1 text-sm-medium">
        <span className="text-text-secondary">소속 팀의 팀장 또는 인사담당자가 승인해요.</span>
        <span className="text-text-disabled">먼저 처리한 사람의 결정이 적용돼요. 승인 전에는 취소할 수 있어요.</span>
      </div>

      <Modal.Footer>
        <BaseButton variant="outlinedSecondary" size="large" onClick={close}>
          취소
        </BaseButton>
        <BaseButton variant="solid" size="large" onClick={submit} disabled={!selected || isPending}>
          {isPending ? "신청 중..." : "신청하기"}
        </BaseButton>
      </Modal.Footer>
    </Modal>
  );
};

export default RequestLeaveModal;
