import getTaskDetail from "./getTaskDetail";
import { GetTaskDetailRequest } from "@/shared/api/types/taskApi";
import { useQuery } from "@tanstack/react-query";

const useGetTaskDetail = ({ groupId, taskListId, taskId }: GetTaskDetailRequest) => {
  return useQuery({
    queryKey: ["task-list-detail", groupId, taskListId, taskId],
    queryFn: () => getTaskDetail({ groupId, taskListId, taskId }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!taskId,
  });
};
export default useGetTaskDetail;
