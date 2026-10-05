"use client";

import { toastKit } from "@/shared/lib/toastKit";
import tokenStorage from "@/shared/api/tokenStorage";
import { clearAuthCookies } from "@/shared/api/authCookies";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success } = toastKit();

  const logout = async () => {
    await clearAuthCookies();

    tokenStorage.clearTokens();

    queryClient.setQueryData(["user"], null);

    queryClient.removeQueries({ queryKey: ["user"] });

    success("로그아웃 되었습니다.");

    router.replace(ROUTES.login);
  };

  return { logout };
};

export default useLogout;
