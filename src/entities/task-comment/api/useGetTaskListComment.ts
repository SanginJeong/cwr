import getTaskListComment from "@/entities/task-comment/api/getTaskListComment";
import { GetTaskListCommentRequest } from "@/shared/api/types/taskCommentApi";
import { useQuery } from "@tanstack/react-query";

const useGetTaskListComment = ({ taskId }: GetTaskListCommentRequest) => {
  return useQuery({
    queryKey: ["task-list-comment", taskId],
    queryFn: () => getTaskListComment({ taskId }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!taskId,
  });
};

export default useGetTaskListComment;
