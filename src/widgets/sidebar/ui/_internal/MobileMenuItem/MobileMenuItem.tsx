import { Icon } from "@/shared/ui/icon";
import { TeamSummary } from "@/shared/api/types/groupApi";
import { cn } from "@/shared/lib/cn";
import { useIsActivePath } from "@/shared/lib/isActivePath";
import Link from "next/link";
import { ROUTES } from "@/shared/config/routes";

interface MobileMenuItemProps {
  team: TeamSummary;
  isOpen: boolean;
}

const MobileMenuItem = ({ team, isOpen }: MobileMenuItemProps) => {
  const isActive = useIsActivePath(ROUTES.team(team.id));

  return (
    <Link
      href={ROUTES.team(team.id)}
      aria-label={`${team.name} 팀으로 이동`}
      className={cn(
        "w-full min-h-[42px] px-4 py-2 flex gap-3 items-center rounded-xl",
        "text-text-primary bg-background-primary hover:bg-background-tertiary transition-colors",
        isActive && "text-brand-primary bg-blue-50",
      )}
    >
      <Icon name="chess" className={cn("size-5 tablet:size-5", isActive ? "text-brand-primary" : "text-slate-300")} />
      {isOpen && (
        <span className={cn("flex-1 truncate", isActive ? "text-lg-semibold" : "text-lg-regular")}>{team.name}</span>
      )}
    </Link>
  );
};

export default MobileMenuItem;
