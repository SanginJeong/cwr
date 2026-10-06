"use client";

import { toastKit } from "@/shared/lib/toastKit";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";
import { getSupabase } from "@/shared/api/supabase/client";

const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success } = toastKit();

  const logout = async () => {
    await getSupabase().auth.signOut();

    queryClient.setQueryData(["user"], null);

    queryClient.removeQueries({ queryKey: ["user"] });

    success("로그아웃 되었습니다.");

    router.replace(ROUTES.login);
  };

  return { logout };
};

export default useLogout;
