"use client";

import { useEffect, useState } from "react";
import SidebarMobile from "./_internal/SidebarMobile/SidebarMobile";
import SidebarTablet from "./_internal/SidebarTablet/SidebarTablet";
import { useGetUser } from "@/entities/user";
import { useGetVisibleTeams } from "@/entities/team";
import { useReviewLeaveRequests } from "@/entities/attendance";
import { useLogout } from "@/features/auth/logout";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { SIDEBAR_OPEN_COOKIE } from "@/shared/config/sidebar";
import { usePresenceStatusOptions } from "@/features/presence/set-status";
import { selectMyStatus, usePresenceStore } from "@/entities/presence";
import type { ManagementMenu } from "./_types/SidebarProps";

/**
 * @author jikwon
 * @component
 * @example
 * ```tsx
 * <Sidebar initialOpen={cookie !== "false"} />
 * ```
 */

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const saveSidebarOpen = (open: boolean) => {
  document.cookie = `${SIDEBAR_OPEN_COOKIE}=${open}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

interface SidebarProps {
  /** 쿠키에 저장된 값. 처음 방문하면 펼친 상태로 시작한다 */
  initialOpen: boolean;
}

const Sidebar = ({ initialOpen }: SidebarProps) => {
  // 처음 방문하면 펼친 상태로 시작한다. 접혀 있으면 이름·배지가 보이지 않아 첫인상에서 핵심 기능이 숨는다
  // (E2E에서 발견: 저장된 값이 없는 새 브라우저). 사용자가 접으면 그 값을 쿠키에 기억한다
  const [isOpen, setIsOpen] = useState(initialOpen);
  // 모바일 서랍은 저장하지 않는다. PC에서 펼쳐 둔 값(sidebarOpen)을 쓰면 페이지마다 서랍이 열린 채 시작했다
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // 예전에는 localStorage에 저장했다. 남아 있는 값은 한 번만 쿠키로 옮긴다
  useEffect(() => {
    try {
      const legacy = localStorage.getItem(SIDEBAR_OPEN_COOKIE);
      if (legacy === null) return;
      localStorage.removeItem(SIDEBAR_OPEN_COOKIE);
      if (document.cookie.includes(`${SIDEBAR_OPEN_COOKIE}=`)) return;
      saveSidebarOpen(legacy === "true");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 옮기는 첫 방문 한 번만 바뀐다
      setIsOpen(legacy === "true");
    } catch {
      // 저장소를 막아 둔 브라우저에서는 옮기지 않는다
    }
  }, []);
  const router = useRouter();
  const pathname = usePathname();
  // 서랍에서 다른 페이지로 이동하면 닫는다 (사이드바는 루트 레이아웃에 있어 이동해도 남아 있다)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileOpen(false);
  }

  const { data: user } = useGetUser();
  const isHrAdmin = user?.companyRole === "HR_ADMIN";
  const { data: allTeams } = useGetVisibleTeams({ enabled: isHrAdmin });
  const teams = isHrAdmin
    ? (allTeams ?? [])
    : (user?.memberships.map(({ groupId, group }) => ({ id: groupId, name: group.name })) ?? []);
  // 관리 메뉴: 인사담당자는 인사 관리 전체, 팀장(어느 팀이든 ADMIN)은 휴가 승인. 배지는 대기 건수
  const isLeader = user?.memberships.some((m) => m.role === "ADMIN") ?? false;
  const { data: pendingReviews } = useReviewLeaveRequests(true, isLeader || isHrAdmin);
  const pendingCount = pendingReviews?.length ?? 0;
  const managementMenu: ManagementMenu | undefined = isHrAdmin
    ? {
        label: "인사 관리",
        links: [
          { title: "구성원 관리", href: ROUTES.adminMembers, iconName: "user" },
          { title: "근태 정책", href: ROUTES.adminPolicies, iconName: "setting" },
          { title: "휴가 승인", href: ROUTES.adminApprovals, iconName: "check", badge: pendingCount },
        ],
      }
    : isLeader
      ? {
          label: "팀장",
          links: [{ title: "휴가 승인", href: ROUTES.approvals, iconName: "check", badge: pendingCount }],
        }
      : undefined;
  const { logout } = useLogout();
  const statusOptions = usePresenceStatusOptions();
  const myStatus = usePresenceStore(selectMyStatus);

  const handleOpenDropdown = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    saveSidebarOpen(newOpenState);
  };

  const options = [
    // 접속 상태 선택
    ...statusOptions,
    { label: "마이 히스토리", action: () => router.push(ROUTES.history) },
    { label: "계정 설정", action: () => router.push(ROUTES.account) },
    { label: "로그아웃", action: logout },
  ];

  return (
    <>
      <SidebarTablet
        user={user || null}
        teams={teams}
        isHrAdmin={isHrAdmin}
        managementMenu={managementMenu}
        isOpen={isOpen}
        handleOpenDropdown={handleOpenDropdown}
        options={options}
        myStatus={myStatus}
      />
      <SidebarMobile
        user={user || null}
        teams={teams}
        isHrAdmin={isHrAdmin}
        managementMenu={managementMenu}
        isOpen={isMobileOpen}
        handleOpenDropdown={() => setIsMobileOpen((open) => !open)}
        options={options}
        myStatus={myStatus}
      />
    </>
  );
};

export default Sidebar;
