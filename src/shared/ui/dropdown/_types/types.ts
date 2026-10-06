import { ReactNode } from "react";

export type DropdownOption = {
  label: string;
  action: () => void;
  /** 라벨 앞에 붙는 아이콘 (예: 접속 상태 점) */
  icon?: ReactNode;
  /** 현재 선택된 항목이면 체크 표시 */
  selected?: boolean;
};
