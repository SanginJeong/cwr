import { useQuery } from "@tanstack/react-query";
import { UserResponse } from "@/types/UserType";
import tokenStorage from "@/utils/tokenStorage";
import getUser from "@/api/axios/user/getUser";

const useGetUser = () => {
  const isLoggedIn = typeof window !== "undefined" && !!tokenStorage.getAccessToken();

  return useQuery<UserResponse, Error>({
    queryKey: ["user"],
    queryFn: () => getUser(),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export default useGetUser;
