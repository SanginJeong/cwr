import instance from "@/shared/api/instance";
import { GetTaskDetailRequest, GetTaskDetailResponse } from "@/shared/api/types/taskApi";

const getTaskDetail = async ({ groupId, taskListId, taskId }: GetTaskDetailRequest): Promise<GetTaskDetailResponse> => {
  const response = await instance.get<GetTaskDetailResponse>(
    `/groups/${groupId}/task-lists/${taskListId}/tasks/${taskId}`,
  );

  return response.data || [];
};

export default getTaskDetail;
