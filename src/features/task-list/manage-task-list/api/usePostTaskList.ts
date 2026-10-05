import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastKit } from "@/shared/lib/toastKit";
import postTaskList from "./postTaskList";
import { PostTaskListRequest } from "@/shared/api/types/taskListApi";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/shared/config/routes";

const usePostTaskList = () => {
  const router = useRouter();
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, name }: PostTaskListRequest) => postTaskList({ groupId, name }),

    onSuccess: (data, variables) => {
      const { id } = data;
      const { groupId } = variables;

      success("할 일 추가 성공");
      queryClient.invalidateQueries({
        queryKey: ["groups", Number(groupId)],
      });

      router.replace(ROUTES.taskList(groupId, id));
    },

    onError: () => {
      error("할 일 추가 실패");
    },
  });
};

export default usePostTaskList;
