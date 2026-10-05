import Icon from "@/common/Icon/Icon";
import { Membership } from "@/types/UserType";
import { cn } from "@/utils/cn";
import { useIsActivePath } from "@/utils/isActivePath";
import Link from "next/link";

interface MobileMenuItemProps {
  membership: Membership;
  isOpen: boolean;
}

const MobileMenuItem = ({ membership, isOpen }: MobileMenuItemProps) => {
  const isActive = useIsActivePath(`/team/${membership.groupId}`);

  return (
    <Link
      href={`/team/${membership.groupId}`}
      aria-label={`${membership.group.name} 팀으로 이동`}
      className={cn(
        "w-full min-h-[52px] p-4 flex gap-3 items-center rounded-xl",
        "text-text-primary bg-background-primary hover:bg-background-tertiary transition-colors",
        isActive && "text-brand-primary bg-blue-50",
      )}
    >
      <Icon name="chess" className={cn("size-5 tablet:size-5", isActive ? "text-brand-primary" : "text-slate-300")} />
      {isOpen && (
        <span className={cn("flex-1 truncate", isActive ? "text-lg-semibold" : "text-lg-regular")}>
          {membership.group.name}
        </span>
      )}
    </Link>
  );
};

export default MobileMenuItem;
