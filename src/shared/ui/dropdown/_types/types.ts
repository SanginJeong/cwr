import { ReactNode } from "react";

export type DropdownOption = {
  label: string;
  /** 하위 메뉴(children)가 있는 항목은 누르면 하위 메뉴를 연다 */
  action?: () => void;
  /** 라벨 앞에 붙는 아이콘 (예: 접속 상태 점) */
  icon?: ReactNode;
  /** 현재 선택된 항목이면 체크 표시 */
  selected?: boolean;
  /** 옆으로 열리는 하위 메뉴 */
  children?: DropdownOption[];
};
