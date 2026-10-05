import { useQuery } from "@tanstack/react-query";
import { GetTaskRequest } from "@/shared/api/types/taskApi";
import getTask from "@/entities/task/api/getTask";

const useGetTask = ({ groupId, taskListId, date }: GetTaskRequest) => {
  return useQuery({
    queryKey: ["task-list", groupId, taskListId, date],
    queryFn: () => getTask({ groupId, taskListId, date }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!taskListId,
  });
};

export default useGetTask;
