import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import Image from "next/image";
import { Dropdown } from "@/shared/ui/dropdown";
import { Icon } from "@/shared/ui/icon";
import { SidebarDropdownProps } from "../../_types/SidebarProps";
import LeftMobile from "../LeftMobile/LeftMobile";
import { ROUTES } from "@/shared/config/routes";
import { StatusDot } from "@/shared/ui/profile";

const SidebarMobile = ({
  user,
  teams,
  isHrAdmin,
  isOpen,
  handleOpenDropdown,
  options,
  myStatus,
}: SidebarDropdownProps) => {
  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-20 flex items-center justify-between bg-background-primary px-4 py-3",
          "tablet:hidden pc:hidden",
        )}
      >
        <div className={cn("flex items-center", user && "gap-3")}>
          {user && (
            <button aria-label="메뉴 열기" onClick={() => handleOpenDropdown(isOpen)}>
              <Icon name="menu" className="size-6 tablet:size-6" />
            </button>
          )}

          <Link
            href={ROUTES.home}
            aria-label="홈으로 이동"
            className="text-brand-primary font-bold text-5 pr-[22px] flex items-center gap-[2px]"
          >
            <Icon name="logo" className="size-6 tablet:size-6" />
            {!user && <span>COWORKERS</span>}
          </Link>
        </div>
        {user ? (
          <Dropdown
            options={options}
            placement="bottom-right"
            image={
              <span className="relative block">
                <Image
                  src={user.image ? user.image : "/TEST_IMG/image-1.jpg"}
                  alt={`${user.nickname} 이미지`}
                  width={28}
                  height={28}
                  className="size-7 rounded-full"
                />
                {myStatus && <StatusDot status={myStatus} size="sm" className="absolute -bottom-0.5 -right-0.5" />}
              </span>
            }
          />
        ) : (
          <Link href={ROUTES.login} aria-label="로그인 페이지로 이동" className="text-sm font-medium">
            로그인
          </Link>
        )}
      </nav>

      <LeftMobile
        isOpen={isOpen}
        handleOpenDropdown={handleOpenDropdown}
        user={user}
        teams={teams}
        isHrAdmin={isHrAdmin}
      />
    </>
  );
};

export default SidebarMobile;
