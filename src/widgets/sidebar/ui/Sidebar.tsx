"use client";

import { startTransition, useEffect, useState } from "react";
import SidebarMobile from "./_internal/SidebarMobile/SidebarMobile";
import SidebarTablet from "./_internal/SidebarTablet/SidebarTablet";
import { useGetUser } from "@/entities/user";
import { useGetVisibleTeams } from "@/entities/team";
import { useLogout } from "@/features/auth/logout";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { usePresenceStatusOptions } from "@/features/presence/set-status";
import { selectMyStatus, usePresenceStore } from "@/entities/presence";

/**
 * @author jikwon
 * @component
 * @example
 * ```tsx
 * <Sidebar user={user} />
 * ```
 */

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const initialIsOpen = typeof window !== "undefined" ? localStorage.getItem("sidebarOpen") : null;
    if (initialIsOpen !== null) {
      startTransition(() => {
        setIsOpen(initialIsOpen === "true");
      });
    }
  }, []);
  const router = useRouter();

  const { data: user } = useGetUser();
  const isHrAdmin = user?.companyRole === "HR_ADMIN";
  const { data: allTeams } = useGetVisibleTeams({ enabled: isHrAdmin });
  const teams = isHrAdmin
    ? (allTeams ?? [])
    : (user?.memberships.map(({ groupId, group }) => ({ id: groupId, name: group.name })) ?? []);
  const { logout } = useLogout();
  const statusOptions = usePresenceStatusOptions();
  const myStatus = usePresenceStore(selectMyStatus);

  const handleOpenDropdown = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", String(newOpenState));
    }
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
        isOpen={isOpen}
        handleOpenDropdown={handleOpenDropdown}
        options={options}
        myStatus={myStatus}
      />
      <SidebarMobile
        user={user || null}
        teams={teams}
        isHrAdmin={isHrAdmin}
        isOpen={isOpen}
        handleOpenDropdown={handleOpenDropdown}
        options={options}
        myStatus={myStatus}
      />
    </>
  );
};

export default Sidebar;
