import { FormEvent, useState } from "react";
import { DateValue } from "@/shared/api/types/DatePickerType";
import { Frequency } from "@/shared/api/types/FrequencyType";
import usePostRecurring from "../../../api/usePostRecurring";

interface UseTodoFormProps {
  onClose: () => void;
  groupId: number;
  taskListId: number;
  repeatConfig: {
    order: Frequency;
    weekDays: number[];
    monthDay: number | null;
  };
}

export const useTodoForm = ({ onClose, groupId, taskListId, repeatConfig }: UseTodoFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    startDate: new Date(),
    todoMemo: "",
  });

  const { mutate: postRecurring } = usePostRecurring();

  // 메모는 선택 사항이다 (수정 창과 같다). 예전에는 메모가 비면 안내 없이 "만들기"가 꺼져 있었다
  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.startDate !== null &&
    (repeatConfig.order === "WEEKLY"
      ? repeatConfig.weekDays.length > 0
      : repeatConfig.order === "MONTHLY"
        ? repeatConfig.monthDay !== null
        : true);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    postRecurring({
      groupId,
      taskListId,
      body: {
        name: formData.title.trim(),
        description: formData.todoMemo.trim(),
        startDate: formData.startDate.toISOString(),
        frequencyType: repeatConfig.order,
        ...(repeatConfig.order === "WEEKLY" ? { weekDays: repeatConfig.weekDays } : {}),
        ...(repeatConfig.order === "MONTHLY" ? { monthDay: repeatConfig.monthDay } : {}),
      },
    });

    onClose();
  };

  const onChangeDate = (date: DateValue) => {
    if (date === null) return;

    const selectedDate = Array.isArray(date) ? date[0] : date;
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        startDate: selectedDate,
      }));
    }
  };

  return {
    formData,
    setFormData,
    isFormValid,
    onSubmit,
    onChangeDate,
  };
};
