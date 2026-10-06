import { useQuery } from "@tanstack/react-query";
import { UserResponse } from "@/shared/api/types/UserType";
import getUserWithSupabase from "./getUser.supabase";
import { hasSupabaseSession } from "@/shared/api/supabase/client";

const useGetUser = () => {
  const isLoggedIn = typeof window !== "undefined" && hasSupabaseSession();

  return useQuery<UserResponse, Error>({
    queryKey: ["user"],
    queryFn: getUserWithSupabase,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export default useGetUser;
