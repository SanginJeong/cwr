import type { ManagementMenu } from "../../_types/SidebarProps";
import SidebarLink from "../SidebarLink/SidebarLink";

/** 사이드바의 관리 메뉴 묶음 ("팀장" / "인사 관리"). 접힌 사이드바에서는 제목을 숨긴다 */
const ManagementMenuSection = ({ menu, isOpen }: { menu: ManagementMenu; isOpen: boolean }) => (
  <div className="w-full flex flex-col gap-1">
    {isOpen && <span className="px-3 text-xs-semibold text-text-disabled">{menu.label}</span>}
    {menu.links.map((link) => (
      <SidebarLink key={link.href} isOpen={isOpen} {...link} />
    ))}
  </div>
);

export default ManagementMenuSection;
