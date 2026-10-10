import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { usePathname } from "next/navigation";
import SidebarTooltip from "../SidebarTooltip/SidebarTooltip";
import { IconKeys } from "@/shared/ui/icon";

interface SidebarLinkProps {
  title: string;
  isOpen: boolean;
  href: string;
  iconName: IconKeys;
  /** 오른쪽 숫자 배지 (예: 휴가 승인 대기 건수). 0이면 숨긴다 */
  badge?: number;
}

const SidebarLink = ({ title, isOpen, href = "dashboard", iconName = "board", badge }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <div className="relative w-full flex items-center justify-center group">
      <Link
        href={href}
        aria-label={title}
        className={cn(
          "h-[42px] rounded-xl flex items-center gap-3 bg-background-primary",
          isOpen ? "w-full px-4" : "w-[42px] justify-center",
          isActive
            ? "bg-blue-50 text-brand-primary"
            : "bg-transparent text-text-primary hover:bg-background-tertiary transition-colors",
        )}
      >
        <span className="relative flex">
          <Icon
            name={iconName}
            className={cn("size-5 tablet:size-5", isActive ? "text-brand-primary" : "text-slate-300")}
          />
          {!isOpen && !!badge && (
            <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full bg-brand-primary" />
          )}
        </span>
        {isOpen && (
          <span
            className={cn(
              "flex-1 min-w-0 text-lg-regular truncate",
              isActive ? "text-brand-primary" : "text-text-primary",
            )}
          >
            {title}
          </span>
        )}
        {isOpen && !!badge && (
          <span className="min-w-[22px] h-[22px] px-[7px] rounded-full bg-brand-primary text-xs-semibold text-text-inverse flex-center">
            {badge}
            <span className="sr-only">건 대기</span>
          </span>
        )}
      </Link>
      {!isOpen && <SidebarTooltip title={title} />}
    </div>
  );
};

export default SidebarLink;
