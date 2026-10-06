import { User } from "@/shared/api/types/UserType";
import { DropdownOption } from "@/shared/ui/dropdown";
import type { PresenceStatus } from "@/shared/config/presence";

export interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  handleOpenDropdown: (prev: boolean) => void;
}

export interface SidebarDropdownProps extends SidebarProps {
  options: DropdownOption[];
  /** 내 접속 상태. 기존 API 모드에서는 없음 (점을 그리지 않는다) */
  myStatus?: PresenceStatus;
}
