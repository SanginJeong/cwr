import { User } from "@/types/UserType";

export interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  handleOpenDropdown: (prev: boolean) => void;
}

export interface SidebarDropdownProps extends SidebarProps {
  options: { label: string; action: () => void }[];
}
