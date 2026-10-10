import { Icon } from "@/shared/ui/icon";
import { TeamSummary } from "@/shared/api/types/groupApi";
import { useIsActivePath } from "@/shared/lib/isActivePath";
import { cn } from "@/shared/lib/cn";
import Link from "next/link";
import SidebarTooltip from "../SidebarTooltip/SidebarTooltip";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ROUTES } from "@/shared/config/routes";

const DropdownItem = ({ title, id, isOpen }: { title: string; id: string; isOpen: boolean }) => {
  const isActive = useIsActivePath(ROUTES.team(id));

  return (
    <Link
      href={ROUTES.team(id)}
      className={cn(
        "h-[42px] rounded-xl flex items-center gap-3 bg-primary",
        isOpen ? "w-full px-4" : "w-[42px] justify-center",
        isActive
          ? "bg-blue-50 text-brand-primary"
          : "bg-transparent text-text-primary hover:bg-background-tertiary transition-colors",
      )}
    >
      <div className="relative flex items-center justify-center">
        <Icon name="chess" className={cn("size-5 tablet:size-5", isActive ? "text-brand-primary" : "text-slate-300")} />
        {!isOpen && <SidebarTooltip title={title} />}
      </div>
      {isOpen && <span className="flex-1 min-w-0 text-lg-regular truncate">{title}</span>}
    </Link>
  );
};

const SidebarDropdown = ({ isOpen, teams }: { isOpen: boolean; teams: TeamSummary[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <section className="group w-full rounded-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-[42px] flex items-center cursor-pointer rounded-xl select-none",
          // 접혔을 때는 다른 메뉴(SidebarLink)처럼 42px 정사각형을 가운데에 둔다
          isOpen ? "w-full px-4 justify-between" : "w-[42px] mx-auto justify-center",
          "hover:bg-background-tertiary transition-colors",
          open && "bg-background-secondary",
        )}
      >
        <span className="flex items-center gap-3">
          <Icon name="chess" className="size-5 text-slate-300 tablet:size-5" />
          {isOpen && <span className="text-lg-semibold text-slate-400">팀 선택</span>}
        </span>
        {isOpen && (
          <Icon name="downArrow" className={cn("size-5 tablet:size-5 transition-transform", open && "rotate-180")} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ul className="flex flex-col gap-2 mt-2">
              {teams.map((team) => (
                <li key={team.id} className="flex justify-center">
                  <DropdownItem title={team.name} id={team.id.toString()} isOpen={isOpen} />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default SidebarDropdown;
