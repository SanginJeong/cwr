import { Icon } from "@/shared/ui/icon";
import { Membership } from "@/shared/api/types/UserType";
import { cn } from "@/shared/lib/cn";
import { useIsActivePath } from "@/shared/lib/isActivePath";
import Link from "next/link";
import { ROUTES } from "@/shared/config/routes";

interface MobileMenuItemProps {
  membership: Membership;
  isOpen: boolean;
}

const MobileMenuItem = ({ membership, isOpen }: MobileMenuItemProps) => {
  const isActive = useIsActivePath(ROUTES.team(membership.groupId));

  return (
    <Link
      href={ROUTES.team(membership.groupId)}
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
