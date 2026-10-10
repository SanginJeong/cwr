import { cn } from "@/shared/lib/cn";
import Link from "next/link";
import { SidebarDropdownProps } from "../../_types/SidebarProps";
import { Dropdown } from "@/shared/ui/dropdown";
import { Icon } from "@/shared/ui/icon";
import { Profile } from "@/shared/ui/profile";
import SidebarDropdown from "../SidebarDropdown/SidebarDropdown";
import AddTeamButton from "../AddTeamButton/AddTeamButton";
import SidebarLink from "../SidebarLink/SidebarLink";
import ManagementMenuSection from "../ManagementMenuSection/ManagementMenuSection";
import { motion } from "framer-motion";
import { ROUTES } from "@/shared/config/routes";

const SidebarTablet = ({
  user,
  teams,
  isHrAdmin,
  managementMenu,
  isOpen,
  handleOpenDropdown,
  options,
  myStatus,
}: SidebarDropdownProps) => {
  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 270 : 72 }}
      transition={{
        duration: 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <aside
        className={cn(
          // 화면은 밝은 테마, 사이드바만 어두운 테마
          "theme-dark bg-background-secondary flex-col sticky top-0 h-[100vh] border-r border-border-primary z-[10]",
          isOpen ? "w-[270px]" : "w-[72px]",
          "hidden tablet:flex pc:flex",
        )}
      >
        <header className="flex items-center gap-[10px] px-6 py-8 relative">
          <Link href={ROUTES.home} aria-label="홈으로 이동" className="flex items-center gap-1">
            <Icon name="logo" />
            {isOpen && <h2 className="text-brand-primary font-bold text-5 leading-none pr-[22px] m-0">COWORKERS</h2>}
          </Link>
          <button
            type="button"
            aria-label={isOpen ? "사이드바 접기" : "사이드바 펼치기"}
            onClick={() => handleOpenDropdown(isOpen)}
            className={cn(
              "ml-auto rounded-full bg-background-primary",
              isOpen ? "size-7" : "p-1 -mx-1.5 border border-border-primary",
            )}
          >
            {isOpen ? (
              <Icon name="leftFold" className="size-6 tablet:size-6" />
            ) : (
              <Icon name="rightFold" className="size-6 tablet:size-6 text-slate-300" />
            )}
          </button>
        </header>

        <nav className={cn("w-full flex-1 min-h-0 flex flex-col justify-between", isOpen ? "px-6" : "px-[10px]")}>
          <section className="w-full flex-1 min-h-0 flex flex-col items-center justify-start gap-3 overflow-y-auto pb-3">
            {user && (
              <>
                <SidebarLink title="내 근태" isOpen={isOpen} href={ROUTES.attendance} iconName="calendar" />
                {teams.length > 0 && (
                  <>
                    <SidebarDropdown isOpen={isOpen} teams={teams} />
                    <hr className={cn("w-full text-background-tertiary", !isOpen && "hidden")} />
                  </>
                )}

                <SidebarLink title="자유게시판" isOpen={isOpen} href={ROUTES.board} iconName="board" />
                {managementMenu && <ManagementMenuSection menu={managementMenu} isOpen={isOpen} />}
                {isHrAdmin &&
                  (isOpen ? (
                    <AddTeamButton />
                  ) : (
                    <SidebarLink title="팀 추가하기" isOpen={isOpen} href={ROUTES.teamNew} iconName="plus" />
                  ))}
              </>
            )}
          </section>

          <footer
            className={cn(
              "w-full shrink-0 border-t border-border-primary pt-5 pb-6 flex items-center gap-[10px]",
              !isOpen && "flex-center",
            )}
          >
            {user ? (
              <Dropdown
                label="프로필 메뉴"
                options={options}
                placement="top-left"
                image={
                  <div className="flex items-center gap-3">
                    <Profile src={user?.image} alt={user?.nickname} size="lg" status={myStatus} />
                    {isOpen && (
                      <div className="flex flex-col items-start gap-[2px]">
                        <span className="text-text-primary text-lg-medium truncate max-w-[120px]">{user.nickname}</span>
                        <span className="text-slate-400 text-md-medium truncate max-w-[120px]">
                          {isHrAdmin ? "인사담당자" : (user.memberships?.[0]?.group?.name ?? "소속없음")}
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            ) : (
              <div className="flex items-center gap-3">
                {isOpen && <Profile src="" alt="" size="lg" />}
                <Link href={ROUTES.login}>로그인</Link>
              </div>
            )}
          </footer>
        </nav>
      </aside>
    </motion.div>
  );
};

export default SidebarTablet;
