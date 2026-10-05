import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastKit } from "@/shared/lib/toastKit";
import patchTask from "./patchTask";
import { PatchTaskRequest } from "@/shared/api/types/taskApi";

const usePatchTask = () => {
  const { success, error } = toastKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, id, name }: PatchTaskRequest) => patchTask({ groupId, id, name }),

    onSuccess: (_data, variables) => {
      const { groupId } = variables;

      success("할 일 수정 성공");
      queryClient.invalidateQueries({
        queryKey: ["groups", groupId],
      });
    },

    onError: () => {
      error("할 일 수정 실패");
    },
  });
};

export default usePatchTask;
