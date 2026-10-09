"use client";

import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui/icon";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProps } from "../../_types/SidebarProps";
import SidebarLink from "../SidebarLink/SidebarLink";
import ManagementMenuSection from "../ManagementMenuSection/ManagementMenuSection";
import AddTeamButton from "../AddTeamButton/AddTeamButton";
import MobileMenuItem from "../MobileMenuItem/MobileMenuItem";
import { ROUTES } from "@/shared/config/routes";
import { ClockCard } from "@/features/attendance/clock";

const LeftMobile = ({ isOpen, handleOpenDropdown, user, teams, isHrAdmin, managementMenu }: SidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("fixed inset-0 z-30 bg-black/30 tablet:hidden pc:hidden")}
            onClick={() => handleOpenDropdown(isOpen)}
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.18, ease: [0.15, 0.85, 0.25, 1] }}
            className={cn(
              "theme-dark fixed inset-y-0 left-0 z-40 w-[260px] max-w-[85vw] bg-background-primary border-r border-border-primary p-4 flex flex-col gap-4",
              "tablet:hidden pc:hidden",
            )}
            role="dialog"
            aria-modal="true"
          >
            <Icon
              name="x"
              className="size-6 self-end tablet:size-6"
              onClick={() => handleOpenDropdown(isOpen)}
              aria-label="사이드바 닫기"
            />

            {user && <ClockCard variant="sidebar" />}
            <div className="w-full">
              <SidebarLink title="내 근태" isOpen={isOpen} href={ROUTES.attendance} iconName="calendar" />
            </div>

            {teams.map((team) => (
              <MobileMenuItem key={team.id} team={team} isOpen={isOpen} />
            ))}

            <hr />

            <div className="w-full">
              <SidebarLink title="자유게시판" isOpen={isOpen} href={ROUTES.board} iconName="board" />
            </div>
            {managementMenu && <ManagementMenuSection menu={managementMenu} isOpen={isOpen} />}
            {isHrAdmin && <AddTeamButton />}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeftMobile;
