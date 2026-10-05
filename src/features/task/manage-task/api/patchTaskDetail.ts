import instance from "@/shared/api/instance";
import { PatchTaskDetailRequest, PatchTaskDetailResponse } from "@/shared/api/types/taskApi";

const patchTaskDetail = async ({
  groupId,
  taskListId,
  taskId,
  body: { name, description, done },
}: PatchTaskDetailRequest): Promise<PatchTaskDetailResponse> => {
  const response = await instance.patch<PatchTaskDetailResponse>(
    `/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
    {
      name,
      description,
      done,
    },
  );

  return response.data;
};

export default patchTaskDetail;
