"use client";

import { startTransition, useEffect, useState } from "react";
import SidebarMobile from "./_internal/SidebarMobile/SidebarMobile";
import SidebarTablet from "./_internal/SidebarTablet/SidebarTablet";
import { useGetUser } from "@/entities/user";
import { useLogout } from "@/features/auth/logout";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

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
  const { logout } = useLogout();

  const handleOpenDropdown = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", String(newOpenState));
    }
  };

  const options = [
    { label: "마이 히스토리", action: () => router.push(ROUTES.history) },
    { label: "계정 설정", action: () => router.push(ROUTES.account) },
    { label: "팀 참여", action: () => router.push(ROUTES.teamJoin) },
    { label: "로그아웃", action: logout },
  ];

  return (
    <>
      <SidebarTablet user={user || null} isOpen={isOpen} handleOpenDropdown={handleOpenDropdown} options={options} />
      <SidebarMobile user={user || null} isOpen={isOpen} handleOpenDropdown={handleOpenDropdown} options={options} />
    </>
  );
};

export default Sidebar;
