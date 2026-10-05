import { useQuery } from "@tanstack/react-query";
import { UserResponse } from "@/shared/api/types/UserType";
import tokenStorage from "@/shared/api/tokenStorage";
import getUser from "./getUser";
import getUserWithSupabase from "./getUser.supabase";
import { isSupabase } from "@/shared/config/backend";
import { hasSupabaseSession } from "@/shared/api/supabase/client";

const useGetUser = () => {
  const isLoggedIn =
    typeof window !== "undefined" && (isSupabase ? hasSupabaseSession() : !!tokenStorage.getAccessToken());

  return useQuery<UserResponse, Error>({
    queryKey: ["user"],
    queryFn: () => (isSupabase ? getUserWithSupabase() : getUser()),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export default useGetUser;
