import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastKit } from "@/shared/lib/toastKit";
import deleteTaskList from "@/features/task-list/manage-task-list/api/deleteTaskList";
import { DeleteTaskListRequest } from "@/shared/api/types/taskListApi";

const useDeleteTaskList = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, id }: DeleteTaskListRequest) => deleteTaskList({ groupId, id }),

    onSuccess: (_data, variables) => {
      const { groupId } = variables;

      success("할 일 삭제 성공");
      queryClient.invalidateQueries({
        queryKey: ["groups", groupId],
      });
    },

    onError: () => {
      error("할 일 삭제 실패");
    },
  });
};

export default useDeleteTaskList;
