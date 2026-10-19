"use client";

import { useState } from "react";
import { Frequency } from "@/shared/api/types/FrequencyType";
import { useTodoForm } from "./_hooks/useTodoForm";
import { cn } from "@/shared/lib/cn";
import { formatToKoreanDate } from "@/shared/lib/formatDate";
import { BaseButton } from "@/shared/ui/button";
import { DatePicker } from "@/shared/ui/date-picker";
import { Input } from "@/shared/ui/input";
import { InputBox } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";
import AnimatedCollapse from "./_internal/AnimatedCollapse/AnimatedCollapse";
import { RepeatMonthlySelect, RepeatWeeklySelect } from "./_internal/RepeatSelect/RepeatSelect";
import { MODAL_STYLES, REPEAT_OPTIONS } from "./_constants/MODAL_OPTIONS";

type OpenPicker = "date" | null;

interface MakeTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  taskListId: number;
}

const MakeTodoModal = ({ isOpen, onClose, groupId, taskListId }: MakeTodoModalProps) => {
  const [order, setOrder] = useState<Frequency>("ONCE");
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState<number | null>(null);

  const { formData, setFormData, isFormValid, onSubmit, onChangeDate } = useTodoForm({
    onClose,
    groupId: Number(groupId),
    taskListId: Number(taskListId),
    repeatConfig: {
      order,
      weekDays,
      monthDay,
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="select-none">
      <form onSubmit={onSubmit}>
        <Modal.Body className="flex-col-center gap-4">
          <h2 className="text-text-primary text-lg-medium">할 일 만들기</h2>
          <p className="text-text-default text-md-medium text-center">
            할 일은 실제로 행동 가능한 작업 중심으로 <br /> 작성해주시면 좋습니다.
          </p>
          <div className="w-full overflow-y-auto max-h-[60vh] flex flex-col gap-4 hide-scrollbar">
            <Input
              value={formData.title}
              label="할 일 제목"
              placeholder="할 일 제목을 입력해주세요."
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
            {/* 시작 날짜만 받는다. 예전에는 시간도 고르게 했지만 저장하지 않았다(반복 규칙에 시각 칸이 없다) */}
            <div className={cn(MODAL_STYLES.baseDiv, "-mb-4")}>
              <Input
                readOnly
                label="시작 날짜"
                className={cn(MODAL_STYLES.periodDiv, openPicker === "date" && MODAL_STYLES.periodDivPressed)}
                value={formatToKoreanDate(formData.startDate)}
                onClick={() => setOpenPicker((prev) => (prev === "date" ? null : "date"))}
              />
              <AnimatedCollapse isOpen={openPicker === "date"}>
                <DatePicker value={formData.startDate} onChange={onChangeDate} />
              </AnimatedCollapse>
            </div>

            <div className={MODAL_STYLES.baseDiv} onClick={(e) => e.preventDefault()}>
              <p>반복 설정</p>
              <Select
                value={order}
                options={REPEAT_OPTIONS}
                menuPlacement="inline"
                onChange={(value) => {
                  setOrder(value);
                  if (value !== "WEEKLY") {
                    setWeekDays([]);
                  }
                }}
              />
              {order === "WEEKLY" && <RepeatWeeklySelect weekDays={weekDays} setWeekDays={setWeekDays} />}
              {order === "MONTHLY" && <RepeatMonthlySelect monthDay={monthDay} setMonthDay={setMonthDay} />}
            </div>

            <InputBox
              value={formData.todoMemo}
              onChange={(e) => setFormData((prev) => ({ ...prev, todoMemo: e.target.value }))}
              size="md"
              label="할 일 메모 (선택)"
              labelClassName="!text-lg-medium"
              placeholder="할 일 메모를 입력해주세요."
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <BaseButton type="submit" variant="solid" size="large" className="mt-4" disabled={!isFormValid}>
            만들기
          </BaseButton>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default MakeTodoModal;
