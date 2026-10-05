import getGroups from "@/entities/team/api/getGroups";
import { GetGroupsRequest } from "@/shared/api/types/groupApi";
import { useQuery } from "@tanstack/react-query";

const useGetGroups = ({ id }: GetGroupsRequest) => {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroups({ id }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled: !!id,
  });
};

export default useGetGroups;
