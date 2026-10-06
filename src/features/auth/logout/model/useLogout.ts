"use client";

import { toastKit } from "@/shared/lib/toastKit";
import tokenStorage from "@/shared/api/tokenStorage";
import { clearAuthCookies } from "@/shared/api/authCookies";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { isSupabase } from "@/shared/config/backend";
import { getSupabase } from "@/shared/api/supabase/client";

const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success } = toastKit();

  const logout = async () => {
    if (isSupabase) {
      await getSupabase().auth.signOut();
    } else {
      await clearAuthCookies();

      tokenStorage.clearTokens();
    }

    queryClient.setQueryData(["user"], null);

    queryClient.removeQueries({ queryKey: ["user"] });

    success("로그아웃 되었습니다.");

    router.replace(ROUTES.login);
  };

  return { logout };
};

export default useLogout;
