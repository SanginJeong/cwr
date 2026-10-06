import { toastKit } from "@/shared/lib/toastKit";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteTask from "./deleteTask";
import { DeleteTaskRequest } from "@/shared/api/types/taskApi";
import { ROUTES } from "@/shared/config/routes";

const useDeleteTask = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ groupId, taskListId, taskId }: DeleteTaskRequest) => deleteTask({ groupId, taskListId, taskId }),

    onSuccess: (_data, variables) => {
      if (!variables) return;
      const { taskId, groupId, taskListId } = variables;

      success("할 일 삭제 성공");
      // 삭제한 할 일의 상세는 다시 조회하지 않는다 (이동 전까지 패널이 열려 있어 404가 난다)
      queryClient.invalidateQueries({
        queryKey: ["task-list-detail", taskId],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["task-list", groupId, taskListId],
      });
      queryClient.invalidateQueries({
        queryKey: ["task-list-detail", groupId, taskListId, taskId],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["groups", Number(groupId)],
      });

      router.replace(ROUTES.taskList(groupId, taskListId));
    },

    onError: () => {
      error("할 일 삭제 실패");
    },
  });
};

export default useDeleteTask;
