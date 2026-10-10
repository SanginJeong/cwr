import { User } from "@/shared/api/types/UserType";
import { TeamSummary } from "@/shared/api/types/groupApi";
import { DropdownOption } from "@/shared/ui/dropdown";
import type { PresenceStatus } from "@/shared/config/presence";
import type { IconKeys } from "@/shared/ui/icon";

export interface ManagementMenu {
  label: string;
  links: { title: string; href: string; iconName: IconKeys; badge?: number }[];
}

export interface SidebarProps {
  user: User | null;
  /** 사이드바에 보여줄 팀. 인사담당자는 전체, 그 외에는 소속 팀 */
  teams: TeamSummary[];
  /** 팀 추가하기 버튼을 보여줄지 (ADR-006) */
  isHrAdmin: boolean;
  /** 관리 메뉴: 팀장은 "팀장 · 휴가 승인", 인사담당자는 "인사 관리 · 구성원·정책·휴가 승인". 없으면 숨긴다 */
  managementMenu?: ManagementMenu;
  isOpen: boolean;
  handleOpenDropdown: (prev: boolean) => void;
}

export interface SidebarDropdownProps extends SidebarProps {
  options: DropdownOption[];
  /** 내 접속 상태. 기존 API 모드에서는 없음 (점을 그리지 않는다) */
  myStatus?: PresenceStatus;
}
